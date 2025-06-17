/*
    After Effects Script - VERSION FINALE ET ROBUSTE (Corrigée)
    INSTRUCTIONS :
    1. Placez ce fichier "create_video_FINAL.jsx" et "log.txt" dans le même dossier.
    2. Ouvrez After Effects.
    3. Allez dans Fichier > Scripts > Exécuter le fichier de script...
    4. Sélectionnez ce fichier.
*/

(function() {
    // Configuration
    var CONFIG = {
        COMP_DURATION: 15, // Durée maximale de chaque composition (réduite de 30 à 15 secondes)
        CHARS_PER_SECOND: 15, // Vitesse d'apparition du texte
        FONT_SIZE: 42, // Augmenté de 28 à 42
        MARGIN: 30 // Réduit de 50 à 30
    };

    // Lire le fichier log
    var scriptFile = new File($.fileName);
    var logFile = new File(scriptFile.path + "/log.txt");
    
    if (!logFile.exists) {
        alert("log.txt non trouvé!");
        return;
    }
    
    logFile.open("r");
    var content = logFile.read();
    logFile.close();
    
    // Parser le contenu en segments
    var lines = content.split(/\r\n|\n|\r/);
    var segments = [[]];
    var currentSegment = 0;
    var currentSegmentDuration = 0;
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var match = line.match(/\s*\[(\d{2}:\d{2}:\d{2})\]\s*>\s*"(.*)"/);
        
        if (match) {
            var lineDuration = line.length / CONFIG.CHARS_PER_SECOND;
            
            // Si cette ligne ferait dépasser la durée max, créer un nouveau segment
            if (currentSegmentDuration + lineDuration > CONFIG.COMP_DURATION) {
                currentSegment++;
                segments[currentSegment] = [];
                currentSegmentDuration = 0;
            }
            
            segments[currentSegment].push(line);
            currentSegmentDuration += lineDuration;
        }
    }
    
    // Tableau pour stocker les références aux compositions
    var segmentComps = [];
    
    // Créer une composition pour chaque segment
    for (var segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
        var segmentLines = segments[segmentIndex];
        if (segmentLines.length === 0) continue;
        
        // Créer la composition
        var comp = app.project.items.addComp(
            "Terminal_Video_Part_" + (segmentIndex + 1),
            1920, 1080,
            1,
            CONFIG.COMP_DURATION,
            30
        );
        
        // Stocker la référence
        segmentComps.push(comp);
        
        // Fond noir
        comp.layers.addSolid([0, 0, 0], "BG", 1920, 1080, 1, CONFIG.COMP_DURATION);
        
        // Créer le calque de texte
        var textLayer = comp.layers.addText("");
        var textProp = textLayer.property("Source Text");
        var textDocument = textProp.value;
        
        // Configuration du texte
        textDocument.font = "Monaco";
        textDocument.fontSize = CONFIG.FONT_SIZE;
        textDocument.fillColor = [1, 1, 1];
        textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;
        
        // Animer le texte
        var currentText = "";
        var currentTime = 0;
        
        for (var i = 0; i < segmentLines.length; i++) {
            if (currentText !== "") currentText += "\n";
            currentText += segmentLines[i];
            
            textDocument.text = currentText;
            textProp.setValueAtTime(currentTime, textDocument);
            
            currentTime += segmentLines[i].length / CONFIG.CHARS_PER_SECOND;
        }
        
        // Ajuster la durée finale de la composition
        comp.duration = Math.min(currentTime + 1, CONFIG.COMP_DURATION);
        
        // Positionner le texte
        textLayer.property("Position").setValue([CONFIG.MARGIN, CONFIG.MARGIN]);
    }
    
    // Créer une composition principale qui contient toutes les autres
    var mainComp = app.project.items.addComp(
        "Terminal_Video_FINAL",
        1920, 1080,
        1,
        segments.length * CONFIG.COMP_DURATION,
        30
    );
    
    // Fond noir pour la composition principale
    mainComp.layers.addSolid([0, 0, 0], "BG", 1920, 1080, 1, mainComp.duration);
    
    // Ajouter chaque segment à la suite
    var currentTime = 0;
    for (var i = 0; i < segmentComps.length; i++) {
        var layer = mainComp.layers.add(segmentComps[i]);
        layer.startTime = currentTime;
        currentTime += CONFIG.COMP_DURATION;
    }
    
    mainComp.openInViewer();
})(); 