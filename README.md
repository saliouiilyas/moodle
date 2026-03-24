# Moodle SCORM Automation Scripts

Simple scripts to automate SCORM quiz completion in Moodle by sending completion data directly.

## Quick setup

1. Open your SCORM quiz in Moodle  
2. Click “Start”  
3. Open the browser console (F12)  
4. Paste the script from `scorm-automation.js`  
5. Hit Enter  

If everything works, the quiz should mark itself as completed.

## What the script does

- Finds the SCORM API on the page  
- Pulls required parameters from the URL  
- Detects the number of questions  
- Sends completion data (score, status, etc.)  
- Commits everything back to Moodle  

## Notes

This relies on how SCORM tracking works internally. If a quiz uses additional validation or server-side checks, this may not work as expected.


## Why this works

- Quiz answers are harcoded on the data variable in the html source code of the page and all validation is client-side
- data variable is encoded using base64 , which easily decoded , and answers of the questions can be eazily extracted 
