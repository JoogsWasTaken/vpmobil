(function($) {
    
    /*
        Parameter für Timing-Sequenzen in der Ausführung des Codes
    */

    var params = {
        
        // Langsames sliden eines Elements
        slideLangsam : 400,
        // Schnelles sliden eines Elements
        slideSchnell : 200,
        // Timeout in Millisekunden für den AJAX-Call zum Vertretungsplan
        ajaxTimeout : 5000
        
    }

    /*
        Objekt welche alle wichtigen Nodes als jQuery-Objekt bereithält
    */

    var nodes = {
        
        // Element welches die Ladesequenz anzeigt
        $laden : $(".item.laden"),
        // Element zum Login mit Passwort
        $login : $(".item.login"),
        // Element welches alle Einträge beinhält
        $eintraege : $(".eintraege"),
        // Wrapper um die ganzen Steuerelemente
        $steuerWrapper : $(".steuer-wrapper"),
        // Element mit dem Hinweis dass die lokale Kopie angezeigt wird
        $lokal : $(".item.lokal"),
        
        // Element welches die Templates beinhält
        $templates : $(".templates"),
        
        // Element welches die <form> für den Login bereithält
        $loginFormular : $(".item.login").find("form"),
        // Element für die Eingabe des Passworts
        $loginFormularPasswort : $(".item.login").find(".passwort"),
        
        // Element zur Eingabe der Klasse
        $inputKlasse : $("#input-klasse"),
        // Element zur Eingabe des Wochentags
        $inputTag : $("#input-tag"),
        
        // Alle Optionen innerhalb der Klassenauswahl
        $inputKlasseOptionen : $("#input-klasse").find("li"),
        // Element welches als Container für alle Optionen dient
        $inputKlasseOptionenListe : $("#input-klasse").find(".optionen"),
        // Element welches als Header für die Klassenauswahl dient
        $inputKlasseHeader : $("#input-klasse").find(".header"),
        
        // Alle Optionen innerhalb der Tagauswahl
        $inputTagOptionen : $("#input-tag").find("li"),
        // Element welches als Container für alle Optionen dient
        $inputTagOptionenListe : $("#input-tag").find(".optionen")
        
    }

    /*
        Utilities welche innerhalb des gesamten Codes gebraucht werden
    */

    var utils = {
        
        /*
            Füllt einen String linksseitig mit Nullen auf. Der Parameter "zahl"
            ist die Zahl die "aufgefüllt" werden soll und der Parameter "stellen"
            ist die Anzahl der Stellen die nach links "aufgefüllt werden soll".
            
            Beispiel: utils.nullPad(52, 4) => "0052"
        */
        nullPad : function(zahl, stellen) {
            var str = String(zahl);
            var pad = "", i = 0;
            
            for (; i < stellen; i++)
                pad += "0";
            
            return (pad + str).substring(str.length);
        },
        
        /*
            Lädt ein Template mit dem entsprechenden Namen aus dem Dokument und
            füllt dieses mit den Key=>Value Assoziationen aus dem Parameter "obj"
            auf.
            
            Beispiel: template - <div>{{test}}</div>
                      obj - { test: "foobar" }
                      
                          => <div>foobar</div>
        */
        template : (function() {
            
            var templates = [];
            
            var templateId;
            
            nodes.$templates.children().each(function(i, templateNode) {
                if ((templateId = $(this).data("template")) !== undefined) {
                    templates[templateId] = $(this).html();
                }
            });
            
            return function(templateName, obj) {
                var htmlContent = templates[templateName];
                
                $.each(obj, function(key, value) {
                    
                    htmlContent = htmlContent.replace(
                        new RegExp("{{" + key + "}}", "g"), value
                    );
                    
                });
                
                return htmlContent;
            }
            
        })(),
        
        /*
            Eight. Eight. Eight. Eight. Eight. Eight. Eight. Eight. Eight. Eight. 
        */
        eight : (function() {
            
            var soundEight;
            
            try {
                soundEight = new Audio("eight.mp3");
                soundEight.preload = true;
            } catch (e) {}
            
            return function() {
                if (soundEight !== undefined) {
                    soundEight.pause();
                    soundEight.currentTime = 0;
                    soundEight.play();
                }
            }
            
        })()
        
    }

    /*
        Verantwortlich für das Laden und Anzeigen der Vertretungspläne, quasi
        everything() als Objekt.
    */

    var core = (function() {
        
        // Vertretungsplanobjekt (von der API als Objekt geparst)
        var vertretungsplan;
        
        // Monatsnamen in chronologischer Reihenfolge
        var monate = [
                        "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
                        "August", "September", "Oktober", "November", "Dezember"
                    ];
                    
        // Regex zum Herausfiltern der Monatsnamen aus den Metadaten der Pläne
        var monatRegex = /\d+\. (\w+)/;

        var zeigeLokaleKopieInfo = false;
        
        /*
            Setzt fest ob der Hinweis zur lokalen Kopie angezeigt werden soll
            oder nicht.
        */
        function setZeigeLokaleKopieInfo(zeige) {
            zeigeLokaleKopieInfo = zeige;
        }
        
        /*
            Parst den von der API erhaltenen Vertretungsplan in ein Javascript-
            Objekt und setzt die Daten für die einzelnen Wochentage in der
            Wochentagsauswahl.
        */
        function setVertretungsplanObjekt(vp) {
            try {
                vertretungsplan = $.parseJSON(vp);
            } catch(e) {}
            
            if (vertretungsplan !== undefined) {
                // Zuerst auffüllen mit den Tagen der aktuellen Woche.
                
                var tage = 5, i = 1;
                
                var date = new Date();
                
                while (date.getDay() != 1) // letzter Montag
                    date.setDate(date.getDate() - 1);
                
                for (; i <= tage; i++) {
                    $tag = nodes.$inputTag.find("li[data-value='" + i + "'] .lang");
                    
                    if ($tag.text().trim().length == 0) {
                        var datum = date.getDate() + "." + (date.getMonth() + 1) + "." +
                                    date.getFullYear();
                                    
                        $tag.text(datum);
                    }
                    
                    date.setDate(date.getDate() + 1);
                }
                
                // Danach auffüllen mit den Wochentagen die durch die Vertretungspläne
                // gegeben sind. Die API kann auch Vertretungspläne der nächsten Woche
                // versenden.
                
                $.each(vertretungsplan.plaene, function(i, plan) {                
                    var datum = plan.meta.datum;
                    datum = datum.substring(0, datum.lastIndexOf(" "));
                    
                    var monat = monatRegex.exec(datum)[1];
                    var monatZahl = 0;
                    
                    for (; monatZahl < monate.length; monatZahl++)
                        if (monate[monatZahl] == monat)
                            break;
                        
                    // Index != Monatszahl, also 1 dazu.
                        
                    datum = datum.replace(monat, (monatZahl + 1) + ".")
                                 .replace(/\s/g, "");
                                 
                    nodes.$inputTag.find("li[data-value='" + plan.tag + "'] .lang")
                                   .text(datum);
                });
            }  
        }

        /*
            Aktualisiert die Ansicht der Vertretungspläne entsprechend
            der Parameter die durch die Auswahl des Nutzers gegeben sind.
        */
        
        function aktualisiereVertretungsplanAnsicht() {
            if (vertretungsplan !== undefined) {
                nodes.$eintraege.empty();
                
                var plan;
                
                $.each(vertretungsplan.plaene, function(i, _plan) {
                    // Gibt es einen Vertretungsplan für den ausgewählten Wochentag?
                    
                    if (_plan.tag == userInput.getWochentag()) {
                        plan = _plan;
                        return false;
                    }
                });
                
                if (plan === undefined) {   
                    // Wenn nein, dann zeige die "Keine Vertretungspläne"-Meldung an.
                    nodes.$eintraege.append($(utils.template("info", {
                        html : "Für diesen Wochentag liegen keine Vertretungspläne vor."
                    })));
                } else {
                    // Info als erstes anzeigen. (Hat höchste Priorität.)
                    if (plan.info.length > 0) {
                        nodes.$eintraege.append($(utils.template("info", {
                            html : plan.info
                        })));
                    }
                    
                    // Wenn die Info zur lokalen Kopie angezeigt werden soll,
                    // dann ... tja, zeige die halt an, ne?
                    if (zeigeLokaleKopieInfo) {
                        var ts = new Date();
                        ts.setTime(userStorage.getLetzterVertretungsplanTimestamp());
                    
                        var timestampText = ts.getDate() + "." + (ts.getMonth() + 1) + "." +
                                            ts.getFullYear() + " " + utils.nullPad(ts.getHours(), 2) + ":" + 
                                            utils.nullPad(ts.getMinutes(), 2) + ":" + utils.nullPad(ts.getSeconds(), 2);
                        
                        nodes.$lokal.find(".timestamp").text(timestampText);
                        nodes.$lokal.slideDown(params.slideLangsam);
                    }
                    
                    var hatMindestensEineVertretung = false;
                    
                    // Wenn der ausgewählte Jahrgang keine Vertretung hat, kann
                    // man das ressourcenaufwändige erstellen von Templates lassen.
                    $.each(plan.liste, function(i, vertretung) {
                        if (vertretung.klasse.indexOf(userInput.getKlasse()) != -1) {
                            hatMindestensEineVertretung = true;
                            return false;
                        }
                    });
                    
                    if (hatMindestensEineVertretung) {
                        var letzteStunde;
                        var html = "";
                        
                        // Jetzt wird's witzig. Mit 1.1 werden alle Vertretungen
                        // nach Stunde gruppiert. Weicht also beim iterieren über
                        // die einzelnen Vertretungem die Stunde von der Stunde
                        // der letzten Vertretung ab, muss quasi ein Eintrag
                        // "abgeschlossen" werden und ein neuer Eintrag angefangen
                        // werden. Da nach der letzten Stunde keine weitere Vertretung
                        // kommt muss für die letzten gruppierten Vertretungen der
                        // ganze Code zum "abschließen" eines Eintrags nochmals aus-
                        // geführt werden.
                        
                        $.each(plan.liste, function(i, vertretung) {
                            if (vertretung.klasse.indexOf(userInput.getKlasse()) != -1) {
                                if (letzteStunde != vertretung.stunde) {
                                    if (letzteStunde !== undefined) {
                                        var $eintrag = $(utils.template("eintrag", {
                                            stunde : utils.nullPad(letzteStunde, 2),
                                            meta : html
                                        }));
                                        
                                        nodes.$eintraege.append($eintrag);
                                    }
                                    
                                    letzteStunde = vertretung.stunde;
                                    
                                    html = "";
                                }
                                
                                var fachUndRaum = vertretung.fach + " in " + vertretung.raum + 
                                                  ((vertretung.extra !== undefined) ?
                                                      (" (" + vertretung.extra + ")") :
                                                      "");
                                
                                html += utils.template("subeintrag", {
                                    fachUndRaum : fachUndRaum,
                                    lehrer : vertretung.lehrer,
                                    info : vertretung.info
                                });
                            }
                        });
                        
                        // Dieses "manuelle abschließen" von dem ich oben geschrieben
                        // habe wird hier ausgeführt.
                        if (html.length > 0) {
                            var $eintrag = $(utils.template("eintrag", {
                                stunde : utils.nullPad(letzteStunde, 2),
                                meta : html
                            }));
                            
                            if (letzteStunde == 8) {
                                $eintrag.find(".stunde").click(utils.eight);
                            }
                            
                            nodes.$eintraege.append($eintrag);
                        }
                    } else {
                        // Keine Vertretungen? Zeig das an!
                        nodes.$eintraege.append(utils.template("item", {
                            html : "Es liegen keine Vertretungen für diese Klasse/diesen Jahrgang vor."
                        }));
                    }
                    
                    // Zeige noch an welche Klassen und Lehrer abwesend sind.
                    
                    if (plan.meta.abwesendk.length > 0) {
                        nodes.$eintraege.append(utils.template("meta", {
                            html : "<b>Abwesende Klassen:</b> " + plan.meta.abwesendk
                        }));
                    }
                    
                    if (plan.meta.aenderungl.length > 0) {
                        nodes.$eintraege.append(utils.template("meta", {
                            html : "<b>Lehrer mit Änderungen:</b> " + plan.meta.aenderungl
                        }));
                    }
                }
            }    
        }
        
        /*
            Zeigt die Ansicht aller Vertretungen an und die Steuerelemente.
        */
        
        function zeigeVertretungsplan() {
            nodes.$eintraege.slideDown(params.slideLangsam);
            nodes.$steuerWrapper.slideDown(params.slideLangsam);
        }
        
        return {
            setVertretungsplanObjekt : setVertretungsplanObjekt,
            aktualisiereVertretungsplanAnsicht : aktualisiereVertretungsplanAnsicht,
            setZeigeLokaleKopieInfo : setZeigeLokaleKopieInfo,
            zeigeVertretungsplan : zeigeVertretungsplan,
        }
    })();

    /*
        Speichert und liest den gesamten Input des Users.
    */

    var userStorage = (function() {
        
        // Wenn es den localStorage nicht gibt wird ein Pseudoelement
        // ersatzweise eingefügt welche die wichtigsten Methoden zum
        // Lesen/Speichern von Key=>Value Mappings bereithält. (nicht
        // persistent!!!)
        var storage = window.localStorage || (function() {
            
            var data = {};
            
            return {
                
                setItem : function(key, value) {
                    data[key] = String(value);
                },
                
                getItem : function(key) {
                    return data[key];
                },
                
                removeItem : function(key) {
                    delete data[key];
                },
                
                clear : function() {
                    data = {};
                }
                
            }
            
        })();
        
        // Alle Keys für den Storage in dem die Key=>Value Mappings
        // gespeichert werden.
        var storageKeys = {
          
            letzteKlasse : "aktuelleKlasse",
            letzterWochentag : "aktuellerTag",
            letztePruefsumme : "letzteHash",
            letzterVertretungsplan : "letzterVP",
            letzterVertretungsplanTimestamp : "letzteTimestamp"
          
        };
        
        // Standardwerte für ausgewählte Werte bestimmter Keys.
        var standardWerte = {
            
            letzterWochentag : 1,
            letzteKlasse : "5a"
            
        };
        
        /*
            Liest den Wert für den Key aus dem Storage aus. Existiert dieser
            Wert nicht, so wird der Wert von def zurückgegeben.
        */
        function get(key, def) {
            return storage.getItem(key) || def;
        }
        
        /*
            Setzt ein Key-Value-Paar im Storage.
        */
        function set(key, value) {
            storage.setItem(key, value);
        }
        
        /*
            Alle Getter und Setter die man eigentlich braucht.
        */
        return {
            
            getLetzterWochentag : function() {
                return parseInt(get(storageKeys.letzterWochentag, standardWerte.letzterWochentag));
            },
            
            getLetzteKlasse : function() {
                return get(storageKeys.letzteKlasse, standardWerte.letzteKlasse);
            },
            
            getLetztePruefsumme : function() {
                return get(storageKeys.letztePruefsumme, "");
            },
            
            getLetzterVertretungsplan : function() {
                return get(storageKeys.letzterVertretungsplan, "");
            },
            
            getLetzterVertretungsplanTimestamp : function() {
                return parseInt(get(storageKeys.letzterVertretungsplanTimestamp, 0));
            },
            
            setKlasse : function(value) {
                set(storageKeys.letzteKlasse, value);
            },
            
            setWochentag : function(value) {
                set(storageKeys.letzterWochentag, value);
            },
            
            setLetztePruefsumme : function(value) {
                set(storageKeys.letztePruefsumme, value);
            },
            
            setLetzterVertretungsplan : function(value) {
                set(storageKeys.letzterVertretungsplan, value);
            },
            
            setLetzterVertretungsplanTimestamp : function(value) {
                set(storageKeys.letzterVertretungsplanTimestamp, value);
            }
            
        }
        
    })();
    
    // Das ist ein blöder Hack, aber der muss sein. Vor der 1.1 wurden
    // die Indexe der Eingaben gespeichert. Jetzt werden die Werte selbst
    // gespeichert. Das heißt, wenn im Storage sich nur Zahlen bei der Klasse
    // befinden, dann wird der alte Wert überschrieben und einfach die 5a
    // als "Startklasse" ausgewählt.
    if (/^\d+$/.test(String(userStorage.getLetzteKlasse())))
        userStorage.setKlasse("5a");
    
    // Seltsamerweise habe ich das beim Wochentag ganz gut hinbekommen,
    // also ist kein Fix für die Wochentage notwendig.

    /*
        Reagiert auf Eingaben des Nutzers und ist für alle Listener verantwortlich.
    */

    var userInput = (function() {
        
        // Aktuelle Auswahl des Nutzers.
        var klasse, wochentag;
        
        /*
            Wählt eine Klasse aus entsprechend der Node die über
            den Parameter bestimmt ist und ruft den Code auf zum aktualisieren
            der Vertretungsplanansicht. (Wenn nötig.)
        */
        function selectKlasse(liNode) {
            if (klasse !== liNode.data("value")) {
                klasse = liNode.data("value");
                nodes.$inputKlasseHeader.text(liNode.text());
                
                userStorage.setKlasse(klasse);
                
                core.aktualisiereVertretungsplanAnsicht();
            }
        }
        
        /*
            Initialisiert die Auswahl der Klassen.
        */
        function initAuswahlKlasse() {
            // Listener
            
            // Listener für Klick auf eine Option.
            nodes.$inputKlasseOptionen.click(function() {
                
                $this = $(this);
                
                selectKlasse($this);
                
                nodes.$inputKlasseHeader.toggleClass("expand");
                nodes.$inputKlasseOptionenListe.slideToggle(params.slideSchnell);
                
            });
            
            // Listener für Klick auf den Header.
            nodes.$inputKlasseHeader.click(function() {
                
                $(this).toggleClass("expand");
                
                nodes.$inputKlasseOptionenListe.slideToggle(params.slideSchnell);
                
            });
            
            // Lade den letzten ausgewählten Wert aus dem Storage.
            
            var $letzteKlasse = nodes.$inputKlasse
                                     .find("li[data-value='" + userStorage.getLetzteKlasse() + "']");
            
            selectKlasse($letzteKlasse);
        }
        
        /*
            Wählt einen Wochentag aus entsprechend der Node die über
            den Parameter bestimmt ist und ruft den Code auf zum aktualisieren
            der Vertretungsplanansicht. (Wenn nötig.)
        */
        function selectWochentag(liNode) {
            if (wochentag !== liNode.data("value")) {
                wochentag = liNode.data("value");
                
                nodes.$inputTagOptionen.removeClass("ausgewaehlt");
                liNode.addClass("ausgewaehlt");
                
                userStorage.setWochentag(wochentag);
                
                core.aktualisiereVertretungsplanAnsicht();
            }
        }
        
        /*
            Initialisiert die Auswahl der Wochentage.
        */
        function initAuswahlWochentag() {
            nodes.$inputTagOptionen.click(function() {
                
                selectWochentag($(this));
             
            });
            
            var $letzterWochentag = nodes.$inputTag
                                         .find("li[data-value='" + userStorage.getLetzterWochentag() + "']");
                                        
            selectWochentag($letzterWochentag);
        }
        
        /*
            Initialisiert das Login-Formular.
        */
        function initLogin() {
            nodes.$loginFormular.submit(function(event) {
                // Wenn kein Passwort eingegeben wurde, dann den Nutzer darauf
                // aufmerksam machen.
                if (nodes.$loginFormularPasswort.val().trim().length == 0) {
                    alert("Passwortfeld ist leer. Bitte Eingabe überprüfen.");
                    
                    event.preventDefault();
                }
            });
        }
        
        /*
            Initialisiert den Spoiler für den Hinweis auf die lokale Kopie.
        */
        function initLokalSpoiler() {
            nodes.$lokal.find(".spoiler").click(function() {
                $(this).toggleClass("aktiviert");
                
                if ($(this).hasClass("aktiviert")) {
                    nodes.$lokal.find(".beschreibung").slideDown(params.slideLangsam);
                } else {
                    nodes.$lokal.find(".beschreibung").slideUp(params.slideLangsam);
                }
            })
        }
        
        /*
            Shorthand-Method für alle Initialisierungsaufrufe.
        */
        function initInput() {
            initAuswahlKlasse();
            initAuswahlWochentag();
            initLokalSpoiler();
            initLogin();
        }
        
        initInput();
        
        /*
            Getter für die Auswahl des Nutzers.
        */
        return {
            
            getKlasse : function() {
                return klasse;
            },
            
            getWochentag : function() {
                return wochentag;
            }
            
        }
        
    })();

    // Rufe die API auf mithilfe von Ajax.
    
    $.ajax({
        url : "api/vp.php",
        timeout: params.ajaxTimeout,
        dataType : "json",
        data: {
            c : userStorage.getLetztePruefsumme()
        }
    })
    .always(function() {
        // Immer den Ladehinweis ausblenden.
        nodes.$laden.slideUp(params.slideLangsam);
    })
    .done(function(data, textStatus, jqXHR) {
        // Wenn erfolgreich, aktualisiere alle Informationen über
        // den Vertretungsplan.
        
        userStorage.setLetzterVertretungsplan(jqXHR.responseText);
        userStorage.setLetztePruefsumme(data.pruefsumme);
        userStorage.setLetzterVertretungsplanTimestamp(new Date().getTime());
        
        core.setVertretungsplanObjekt(jqXHR.responseText);
        core.aktualisiereVertretungsplanAnsicht();
        core.zeigeVertretungsplan();
    })
    .fail(function(jqXHR) {
        // Wenn fehlerhaft gibt es bestimmte Statuscodes für bestimmte Events.
        
        // Code 401 => Der Nutzer ist nicht eingeloggt.
        // Code 400 => Die übermittelte Prüfsumme der lokalen Kopie stimmt
        //             mit dem aktuellsten Vertretungsplan überein. Der
        //             Vertretungsplan muss nicht erneut heruntergeladen werden.
        
        // Jeder andere Statuscode ist unbekannt und ist wahrscheinlich ein
        // Fehler serverseits. In dem Fall wäre es besser auf die lokale Kopie
        // zurückzugreifen.
        
        var statuscode = jqXHR.status;
        
        if (statuscode == 401) {
            nodes.$login.slideDown(params.slideLangsam);
        } else if (statuscode == 400) {
            core.setVertretungsplanObjekt(
                userStorage.getLetzterVertretungsplan()
            );
            
            core.aktualisiereVertretungsplanAnsicht();
            core.zeigeVertretungsplan();
        } else {
            core.setZeigeLokaleKopieInfo(true);
            
            core.setVertretungsplanObjekt(
                userStorage.getLetzterVertretungsplan()
            );
            
            core.aktualisiereVertretungsplanAnsicht();
            core.zeigeVertretungsplan();
        }
    });
    
})(jQuery);