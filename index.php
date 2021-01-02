<?php
    include("php/verifizierer.php");
    
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        if (isset($_POST["pw"])) {
            versuch_login_user();
        }
    } else {
        if (!ist_user_autorisiert()) {
            loesche_cookie(COOKIE_USER_HASH);
            loesche_cookie(COOKIE_USER_SALT);
        }
    }
?>
<!DOCTYPE HTML>
<html lang="de" manifest="app.mf">
    <head>
        <title>JMG Guide Online</title>
        
        <meta charset="utf-8" />
        
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,700" type="text/css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/4.1.1/normalize.min.css" type="text/css" />
        <link rel="stylesheet" href="css/jmgguide.min.css?v=1" type="text/css" />
        
        <link rel="apple-touch-icon" sizes="57x57" href="img/favicon/apple-touch-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="img/favicon/apple-touch-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="img/favicon/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="img/favicon/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="img/favicon/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="img/favicon/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="img/favicon/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="img/favicon/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="img/favicon/apple-touch-icon-180x180.png" />
        <link rel="icon" type="image/png" href="img/favicon/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="img/favicon/favicon-194x194.png" sizes="194x194" />
        <link rel="icon" type="image/png" href="img/favicon/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/png" href="img/favicon/android-chrome-192x192.png" sizes="192x192" />
        <link rel="icon" type="image/png" href="img/favicon/favicon-16x16.png" sizes="16x16" />
        <link rel="manifest" href="img/favicon/manifest.json" />
        <link rel="mask-icon" href="img/favicon/safari-pinned-tab.svg" color="#5a7295" />
        <link rel="shortcut icon" href="img/favicon/favicon.ico" />
        
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="msapplication-TileImage" content="img/favicon/mstile-144x144.png" />
        <meta name="msapplication-config" content="img/favicon/browserconfig.xml" />
        <meta name="theme-color" content="#355177" />
    </head>
    <body>
        <div class="templates">
            <div data-template="info">
                <div class="item info">{{html}}</div>
            </div>
            <div data-template="eintrag">
                <div class="item eintrag">
                    <div class="stunde">{{stunde}}</div>
                    <ul class="meta">{{meta}}</ul>
                </div>
            </div>
            <div data-template="subeintrag">
                <li>
                    <p>{{fachUndRaum}}</p>
                    <p>{{lehrer}}</p>
                    <p>{{info}}</p>
                </li>
            </div>
            <div data-template="item">
                <div class="item">{{html}}</div>
            </div>
            <div data-template="meta">
                <div class="item meta">{{html}}</div>
            </div>
        </div>
        <div class="container">
            <div class="wrapper">
                <div class="steuer">
                    <div class="steuer-wrapper" style="display: none;">
                        <div id="input-klasse" class="auswahl">
                            <div class="header"></div>
                            <ul class="optionen">
                                <li data-value="5a">Klasse 5a</li>
                                <li data-value="5b">Klasse 5b</li>
                                <li data-value="5c">Klasse 5c</li>
                                <li data-value="5s">Klasse 5s</li>
                                <li data-value="6a">Klasse 6a</li>
                                <li data-value="6b">Klasse 6b</li>
                                <li data-value="6c">Klasse 6c</li>
                                <li data-value="6s">Klasse 6s</li>
                                <li data-value="7a">Klasse 7a</li>
                                <li data-value="7b">Klasse 7b</li>
                                <li data-value="7c">Klasse 7c</li>
                                <li data-value="7s">Klasse 7s</li>
                                <li data-value="8a">Klasse 8a</li>
                                <li data-value="8b">Klasse 8b</li>
                                <li data-value="8c">Klasse 8c</li>
                                <li data-value="8s">Klasse 8s</li>
                                <li data-value="9a">Klasse 9a</li>
                                <li data-value="9b">Klasse 9b</li>
                                <li data-value="9c">Klasse 9c</li>
                                <li data-value="9s">Klasse 9s</li>
                                <li data-value="10a">Klasse 10a</li>
                                <li data-value="10b">Klasse 10b</li>
                                <li data-value="10c">Klasse 10c</li>
                                <li data-value="10s">Klasse 10s</li>
                                <li data-value="JG11">Jahrgang 11</li>
                                <li data-value="JG12">Jahrgang 12</li>
                                <li data-value="Gast">Gast</li>
                            </ul>
                        </div>
                        <div id="input-tag" class="tabs">
                            <ul class="optionen">
                                <li data-value="1"><span class="kurz">MO</span> <span class="lang"></span></li>
                                <li data-value="2"><span class="kurz">DI</span> <span class="lang"></span></li>
                                <li data-value="3"><span class="kurz">MI</span> <span class="lang"></span></li>
                                <li data-value="4"><span class="kurz">DO</span> <span class="lang"></span></li>
                                <li data-value="5"><span class="kurz">FR</span> <span class="lang"></span></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="listing">
                    <div class="status">
                        <div class="item laden">
                            <div class="laden-icon"></div>
                            <span>Laden ...</span>
                        </div>
                        <div class="item login" style="display: none;">
                            <div class="info">
                                Hallo. Dies scheint das erste Mal zu sein dass du den Online-Vertretungsplan verwendest. Um sicher zu gehen dass du die Vertretungspläne auch einsehen darfst, gebe bitte unten das Passwort ein welches dir am Anfang des Schuljahres gegeben wurde.
                            </div>
                            <form action="#" method="POST">
                                <input placeholder="Passwort hier eingeben" class="passwort" type="password" name="pw" />
                                <input class="absenden" type="submit" value="Absenden" />
                            </form>
                            <div class="info">
                                Nach der ersten erfolgreichen Anmeldung ist es nicht mehr notwendig das Passwort bei jedem Besuch einzugeben.
                            </div>
                        </div>
                        <div class="item lokal" style="display: none;">
                            <span>Die angezeigten Informationen sind vom <span class="timestamp"></span>.</span>
                            <div class="beschreibung">Entweder hat dein Gerät keine Internetverbindung oder es gab einen Fehler beim Herunterladen der Vertretungspläne. In beiden Fällen wird dir die letzte Kopie der Pläne angezeigt welche vom aktuellen Stand abweichen können.</div>
                            <div class="spoiler"></div>
                        </div>
                    </div>
                    <div class="eintraege" style="display: none;">
                    </div>
                </div>
            </div>
            <div class="footer" >
                &copy; 2014 - <?php echo date("Y"); ?> Maximilian Jugl | V1.1.1 "Fuego" | <a href="changelog.txt">Changelog</a>
            </div>
        </div>
        <!--
            IE10 Detection basierend auf diesem Artikel: http://www.impressivewebs.com/ie10-css-hacks/
        -->
        <!--[if !IE]><!--><script>
            if (/*@cc_on!@*/false) {
                document.documentElement.className += " ie10";
            }
        </script><!--<![endif]-->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.3/jquery.min.js"></script>
        <script src="js/modernizr.flex.js"></script>
        <script src="js/jmgguide.min.js?v=1"></script>
    </body>
</html>