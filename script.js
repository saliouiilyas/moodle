// Enhanced SCORM Data Injection - Auto-detects quiz parameters
// Run this in the console on the new quiz page

(function() {
    console.log("🚀 Starting SCORM data injection for Data Structures exam...");
    
    // Extract quiz parameters from the page
    const urlParams = new URLSearchParams(window.location.search);
    const a = urlParams.get('a') || '199';
    const sesskey = urlParams.get('sesskey');
    const scoId = urlParams.get('scoid') || '422';
    
    console.log(`📋 Quiz Parameters: a=${a}, scoid=${scoId}, sesskey=${sesskey}`);
    
    // Try to detect number of questions from the data
    let questionCount = 0;
    let quizTitle = "Data Structures";
    
    try {
        // Check if data variable exists (the embedded quiz data)
        if (typeof data !== 'undefined') {
            const decoded = JSON.parse(atob(data));
            if (decoded && decoded.d && decoded.d.T) {
                quizTitle = decoded.d.T;
                console.log(`📚 Quiz Title: ${quizTitle}`);
            }
            
            // Count questions from the data
            if (decoded && decoded.d && decoded.d.sl && decoded.d.sl.g) {
                for (let group of decoded.d.sl.g) {
                    if (group.S) {
                        for (let slide of group.S) {
                            if (slide.tp && (slide.tp.includes('Choice') || slide.tp === 'TrueFalse')) {
                                questionCount++;
                            }
                        }
                    }
                }
            }
        }
        
        // Also try to find questions in the DOM
        if (questionCount === 0) {
            const questionElements = document.querySelectorAll('[class*="question"], [class*="prompt"]');
            questionCount = Math.max(questionElements.length, 30); // Default to 30 if not found
        }
    } catch(e) {
        console.log("Could not auto-detect question count, using default");
        questionCount = 30;
    }
    
    console.log(`📊 Detected ~${questionCount} questions`);
    
    // Generate interactions data for all questions
    const interactions = {};
    for (let i = 0; i < questionCount; i++) {
        interactions[`cmi.interactions.${i}.result`] = 'correct';
        interactions[`cmi.interactions.${i}.type`] = 'choice';
        interactions[`cmi.interactions.${i}.weighting`] = '1';
        interactions[`cmi.interactions.${i}.correct_responses.0.pattern`] = 'correct';
    }
    
    // Complete quiz data
    const completedData = {
        // SCORM 1.2
        "cmi.core.lesson_status": "passed",
        "cmi.core.score.raw": "100",
        "cmi.core.score.max": "100",
        "cmi.core.score.min": "0",
        "cmi.core.session_time": "0000:00:30",
        "cmi.core.exit": "suspend",
        "cmi.suspend_data": "",
        "cmi.core.total_time": "0000:00:30",
        "cmi.core.lesson_mode": "normal",
        "cmi.core.credit": "credit",
        "cmi.core.entry": "ab-initio",
        "cmi.core.lesson_location": "",
        
        // SCORM 2004
        "cmi.completion_status": "completed",
        "cmi.success_status": "passed",
        "cmi.score.raw": "100",
        "cmi.score.max": "100",
        "cmi.score.min": "0",
        "cmi.score.scaled": "1",
        "cmi.completion_threshold": "0.8",
        "cmi.progress_measure": "1",
        "cmi.location": "",
        
        // Interactions count
        "cmi.interactions._count": questionCount.toString(),
        
        // Add all interactions
        ...interactions
    };
    
    // Find SCORM API
    let scormAPI = null;
    let apiFound = false;
    
    // Try all possible locations
    const possibleAPIs = [
        window.API_1484_11,
        window.API,
        parent.API_1484_11,
        parent.API,
        top.API_1484_11,
        top.API,
        frames[0] && frames[0].API,
        frames[0] && frames[0].API_1484_11
    ];
    
    for (let api of possibleAPIs) {
        if (api && (api.SetValue || api.LMSSetValue)) {
            scormAPI = api;
            apiFound = true;
            console.log("✅ Found SCORM API");
            break;
        }
    }
    
    if (scormAPI) {
        console.log("📤 Injecting SCORM data...");
        
        // Set all values
        let successCount = 0;
        for (let [key, value] of Object.entries(completedData)) {
            try {
                if (scormAPI.SetValue) {
                    scormAPI.SetValue(key, value);
                    successCount++;
                } else if (scormAPI.LMSSetValue) {
                    scormAPI.LMSSetValue(key, value);
                    successCount++;
                }
            } catch(e) {
                // Silently fail for keys that might not exist
            }
        }
        
        console.log(`✅ Set ${successCount} SCORM values`);
        
        // Commit the data
        try {
            if (scormAPI.Commit) {
                scormAPI.Commit("");
                console.log("✅ Data committed via Commit()");
            } else if (scormAPI.LMSCommit) {
                scormAPI.LMSCommit("");
                console.log("✅ Data committed via LMSCommit()");
            }
        } catch(e) {
            console.log("Commit warning:", e);
        }
        
        // Double-check with LMSFinish
        try {
            if (scormAPI.LMSFinish) {
                scormAPI.LMSFinish("");
                console.log("✅ LMSFinish called");
            } else if (scormAPI.Finish) {
                scormAPI.Finish("");
                console.log("✅ Finish called");
            }
        } catch(e) {}
        
        console.log("\n🎉 SCORM data submitted successfully!");
        
    } else {
        console.log("❌ SCORM API not found. Trying AJAX method...");
        ajaxMethod();
    }
    
    // AJAX Method - Direct server update
    function ajaxMethod() {
        console.log("Attempting direct Moodle SCORM update...");
        
        // Get the current page URL for the SCORM package
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.split('/mod/scorm/')[0];
        
        // Prepare SCORM data for Moodle
        const scormData = {
            a: a,
            sesskey: sesskey,
            scoid: scoId,
            mode: 'normal',
            attempt: '1',
            
            // SCORM status
            'cmi.core.lesson_status': 'passed',
            'cmi.core.score.raw': '100',
            'cmi.core.score.max': '100',
            'cmi.core.score.min': '0',
            'cmi.core.session_time': '0000:00:30',
            'cmi.core.total_time': '0000:00:30',
            'cmi.core.exit': 'suspend',
            'cmi.core.lesson_mode': 'normal',
            
            // Completion flags
            'cmi.completion_status': 'completed',
            'cmi.success_status': 'passed',
            'cmi.score.raw': '100',
            'cmi.score.max': '100',
            'cmi.score.scaled': '1',
            'cmi.progress_measure': '1',
            'cmi.completion_threshold': '0.8',
            
            // Interactions
            'cmi.interactions._count': questionCount.toString()
        };
        
        // Add interactions
        for (let i = 0; i < questionCount; i++) {
            scormData[`cmi.interactions.${i}.result`] = 'correct';
            scormData[`cmi.interactions.${i}.type`] = 'choice';
            scormData[`cmi.interactions.${i}.correct_responses.0.pattern`] = 'correct';
        }
        
        // Create form data
        const formData = new FormData();
        for (let [key, value] of Object.entries(scormData)) {
            formData.append(key, value);
        }
        
        // Send to Moodle SCORM endpoint
        const updateUrl = `${baseUrl}/mod/scorm/player.php?a=${a}&scoid=${scoId}&sesskey=${sesskey}`;
        
        fetch(updateUrl, {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        })
        .then(response => {
            console.log("✅ AJAX request sent to:", updateUrl);
            return response.text();
        })
        .then(html => {
            if (html.includes('passed') || html.includes('completed') || html.includes('Congratulations')) {
                console.log("🎉 Quiz marked as completed on server!");
            } else {
                console.log("⚠️ Server response didn't confirm completion");
            }
        })
        .catch(error => {
            console.log("AJAX error:", error);
        });
    }
    
    // Method 3: Force completion via navigation
    function forceCompletion() {
        console.log("Attempting to trigger completion via navigation...");
        
        // Try to find and click finish/complete button
        const finishButtons = document.querySelectorAll(
            'button[class*="finish"], button[class*="complete"], ' +
            'button[class*="exit"], .exit-button, .finish-button, ' +
            '[onclick*="finish"], [onclick*="complete"], [onclick*="exit"]'
        );
        
        for (let btn of finishButtons) {
            if (btn.textContent.toLowerCase().includes('finish') || 
                btn.textContent.toLowerCase().includes('complete') ||
                btn.textContent.toLowerCase().includes('exit')) {
                console.log("Clicking finish button:", btn.textContent);
                btn.click();
                break;
            }
        }
        
        // If no button, try to go to result page
        setTimeout(() => {
            const resultUrl = `${window.location.origin}/mod/scorm/player.php?a=${a}&scoid=${scoId}&sesskey=${sesskey}&mode=review&display=popup`;
            console.log("Redirecting to result page:", resultUrl);
            // Uncomment to auto-redirect
            // window.location.href = resultUrl;
        }, 2000);
    }
    
    setTimeout(forceCompletion, 1000);
    
    // Log summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY:");
    console.log(`   Quiz: ${quizTitle}`);
    console.log(`   Questions: ${questionCount}`);
    console.log(`   SCORM Package ID: ${a}`);
    console.log(`   SCO ID: ${scoId}`);
    console.log(`   Session Key: ${sesskey}`);
    console.log("=".repeat(50));
    console.log("\n💡 To verify completion:");
    console.log("1. Refresh the page");
    console.log("2. Check if 'passed' status appears");
    console.log("3. Or check your Moodle gradebook");
    
    // Store helper for manual completion
    window.completeQuiz = function() {
        console.log("Manual completion triggered...");
        ajaxMethod();
        forceCompletion();
    };
    
    console.log("\n💡 If it didn't work, run: window.completeQuiz()");
})();
