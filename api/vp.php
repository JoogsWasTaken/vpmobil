<?php
    header("Content-type: application/json;charset=utf-8");
    
    include(__DIR__."/../php/verifizierer.php");
    
    if (!ist_user_autorisiert()) {
        http_response_code(401); // unauthorized
        exit;
    }
    
    define("VP_TEMP_ORDNER", __DIR__."/temp/");
    define("VP_DATEN_ORDNER", __DIR__."/../../j252/modules/mod_vplane/VPSchueler/vdaten/");
    define("VP_DATEINAME_REG", "/VplanKl(\d{8})\.xml/");   

    define("VP_KLASSE_EXTRA_REGEX", "/(\w+|\d+)\/ (\w+|\d+)/");
    
    define("ALGO_DATEI_HASH", "md4"); // Schnellster Algorithmus
    define("ALGO_PRUEFSUMME", "crc32b"); // Kürzester Algorithmus
    
    function erstelle_vertretungsplan_backbone($wochentag, $dateiname) {
        $backbone = array();
        
        $backbone["tag"] = $wochentag;
        $backbone["datei"] = $dateiname;
        
        return $backbone;
    }
    
    function get_knoten_wert($node) {
        return (strlen(trim($node)) == 0) ? "---" : trim($node);
    }
    
    function get_kopf_informationen($xml_root) {
        $kopf_objekt = array();
        $kopf = $xml_root->kopf[0];
        
        $kopf_objekt["datum"] = trim(substr($kopf->titel, strpos($kopf->titel, " ")));
        
        $kopf = $kopf->kopfinfo;
        
        $kopf_objekt["aenderungl"] = trim($kopf->aenderungl);
        $kopf_objekt["abwesendk"] = trim($kopf->abwesendk);
        
        return $kopf_objekt;
    }
    
    function get_fuss_informationen($xml_root) {
        $fuss = $xml_root->fuss[0];
        $fuss_info = "";
        
        if (!empty($fuss)) {            
            foreach ($fuss->fusszeile as $zeile):
                $fuss_info .= (strlen($fuss_info) > 0 ? "<br>" : "").trim($zeile->fussinfo);
            endforeach;
            
            if (strlen($fuss_info) == 0)
                return null;
        }
        
        return $fuss_info;
    }
    
    function get_vertretungen($xml_root) {
        $haupt = $xml_root->haupt[0];
        $haupt_objekt = array();
        
        if (!empty($haupt->aktion)) {
            foreach ($haupt->aktion as $vertretung) {
                $vertretung_objekt = array();
                
                $vertretung_objekt["klasse"] = get_knoten_wert($vertretung->klasse);
                $vertretung_objekt["stunde"] = intval(trim($vertretung->stunde));
                $vertretung_objekt["fach"] = get_knoten_wert($vertretung->fach);
                $vertretung_objekt["lehrer"] = get_knoten_wert($vertretung->lehrer);
                $vertretung_objekt["raum"] = get_knoten_wert($vertretung->raum);
                $vertretung_objekt["info"] = get_knoten_wert($vertretung->info);
                
                if (preg_match(VP_KLASSE_EXTRA_REGEX, $vertretung_objekt["klasse"], $extras) != null) {
                    $vertretung_objekt["klasse"] = $extras[1];
                    $vertretung_objekt["extra"] = $extras[2];
                }
                
                $haupt_objekt[] = $vertretung_objekt;
            }
            
            usort($haupt_objekt, function($o1, $o2) {
                if ($o1["stunde"] == $o2["stunde"])
                    return 0;
                
                return ($o1["stunde"] < $o2["stunde"]) ? -1 : 1;
            });
        }
        
        return $haupt_objekt;
    }
    
    $files = scandir(VP_DATEN_ORDNER, SCANDIR_SORT_DESCENDING);
    
    $unteres_limit = strtotime("last monday", strtotime("tomorrow"));
    
    $result_list = array(null, null, null, null, null);
    
    foreach ($files as $file) {
        if (preg_match(VP_DATEINAME_REG, $file, $datum)) {
            $datum = $datum[1];
            $dtime = DateTime::createFromFormat("Ymd", $datum);
            $timestamp = $dtime->getTimestamp();
            
            if ($timestamp < $unteres_limit) {
                break;
            } else {
                $wday = intval(date("w", $timestamp));
                
                if ($result_list[$wday - 1] === null) {
                    $result_list[$wday - 1] = erstelle_vertretungsplan_backbone(
                        $wday, $file
                    );
                }
            }
        }
    }
    
    while (($key = array_search(null, $result_list)) !== false) {
        unset($result_list[$key]);
    }
    
    $csum = "";
    
    foreach ($result_list as $result) {
        $csum .= hash_file(
            ALGO_DATEI_HASH,
            VP_DATEN_ORDNER.($result["datei"])
        );
    }
    
    $csum = hash(ALGO_PRUEFSUMME, $csum);
    
    if (isset($_GET["c"])) {
        $user_pruefsumme = $_GET["c"];
        
        if ($user_pruefsumme == $csum) {
            http_response_code(400);
            exit;
        }
    }
    
    if (in_array($csum, scandir(VP_TEMP_ORDNER))) {
        echo file_get_contents(VP_TEMP_ORDNER.$csum);
    } else {
        $vertretungen_liste = array();
        
        foreach ($result_list as $result) {
            $xml_root = simplexml_load_file(VP_DATEN_ORDNER.$result["datei"]);
            
            unset($result["datei"]);
            
            $result["meta"] = get_kopf_informationen($xml_root);
            $result["liste"] = get_vertretungen($xml_root);
            $result["info"] = get_fuss_informationen($xml_root);
            
            $vertretungen_liste[] = $result;
        }
        
        $ausgabe = array();
        
        $ausgabe["pruefsumme"] = $csum;
        $ausgabe["plaene"] = $vertretungen_liste;
        
        $json = json_encode($ausgabe);
        
        file_put_contents(VP_TEMP_ORDNER.$csum, $json);
        
        echo $json;
    }
?>