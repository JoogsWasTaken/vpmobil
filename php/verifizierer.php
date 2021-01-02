<?php
    // abrufen des hash und des salts. nicht ändern.

    define("PASSWORT_DATEI", __DIR__."/../pass.abc");
    
    $pw_datei_handle = fopen(PASSWORT_DATEI, "r");
    
    if ($pw_datei_handle !== false) {
        define("PASSWORT_HASH", trim(fgets($pw_datei_handle)));
        define("PASSWORT_SALT", trim(fgets($pw_datei_handle)));
        
        fclose($pw_datei_handle);
    } else {
        echo "Die Anmeldedaten für den Webservice wurden entweder beschädigt,
              verschoben oder gelöscht. Solltest du diese Nachricht sehen,
              setze bitte einen Verantwortlichen in Kenntnis.";
        
        http_response_code(500); // internal server error
        exit;
    }
    
    define("COOKIE_USER_HASH", "vph");
    define("COOKIE_USER_SALT", "vpk");
    
    define("USER_SALT_LAENGE", 32);
    
    // verifizierungsverfahren.
    
    // Setzt einen Cookie der "nie" ausläuft. Das eigentliche Auslaufdatum
    // ist 10 Jahre in der Zukunft was bedeutet, dass das Passwort in der
    // Zeit wahrscheinlich schon einmal gewechselt wurde damit dieser Code
    // wieder aktiv wird.
    function set_cookie_nicht_auslaufen($key, $value) {
        setcookie($key, $value, strtotime("+10 years"), "/");
    }
    
    function loesche_cookie($key) {
        unset($_COOKIE[$key]); // serverinvalidation
        setcookie($key, "", time() - 3600); // clientinvalidation
    }
    
    function sha256($text) {
        return hash("sha256", $text);
    }
    
    // funktionalität
    
    function ist_user_autorisiert() {        
        $anmeldung_moeglich = isset($_COOKIE[COOKIE_USER_HASH]) &&
                              isset($_COOKIE[COOKIE_USER_SALT]);
                              
        if ($anmeldung_moeglich) {
            return sha256(PASSWORT_HASH.$_COOKIE[COOKIE_USER_SALT]) ==
                          $_COOKIE[COOKIE_USER_HASH];
        }
        
        return false;
    }
    
    function versuch_login_user() {
        if (isset($_POST["pw"])) {
            $passwort = trim(urldecode($_POST["pw"]));
            
            if (strlen($passwort) > 0) {
                if (sha256($passwort.PASSWORT_SALT) == PASSWORT_HASH) {
                    $user_salt = bin2hex(openssl_random_pseudo_bytes(USER_SALT_LAENGE / 2));
                    $user_hash = sha256(PASSWORT_HASH.$user_salt);
                    
                    set_cookie_nicht_auslaufen(COOKIE_USER_HASH, $user_hash);
                    set_cookie_nicht_auslaufen(COOKIE_USER_SALT, $user_salt);
                }
            }
        }
    }
?>