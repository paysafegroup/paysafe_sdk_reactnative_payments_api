import { danger, warn, fail } from "danger";

// Check if someone used Merge instead of Rebase
if (danger.gitlab.mr.target_branch === "develop") {
  const hasMergeCommit = danger.git.commits.some(commit => commit.message.startsWith("Merge branch"));
  
  if (hasMergeCommit) {
    warn('We prefer to use Rebase instead of Merge. You can check our Pull Request process - https://confluence.neterra.paysafe.com/display/MOB/Pull+Request+Process');
  }
}

// Check if SwiftLint reported any violations

const swiftLintReportFilePath = "./demo/demo-app/ios/swiftlint.json";
const fs = require("fs");

if (fs.existsSync(swiftLintReportFilePath)) {
  const swiftLintReportFileContent = fs.readFileSync(swiftLintReportFilePath, "utf-8");

  if (swiftLintReportFileContent.trim() !== "") {
    const swiftLintReportViolations = JSON.parse(swiftLintReportFileContent);
  
    swiftLintReportViolations.forEach((violation) => {
      const filename = violation.file.split('/').pop();
      const line = violation.line;
      const reason = violation.reason;
      const severity = violation.severity;

      if (severity === "Error") {
        fail(`Swiftlint: ${reason} in ${filename} on line ${line}`, { file: filename, line: line });
      } else {
        warn(`Swiftlint: ${reason} in ${filename} on line ${line}`, { file: filename, line: line });
      }
    });
  }
}

// Check if ESlint reported any violations

const esLintReportFilePath = "eslint-report.json";

if (fs.existsSync(esLintReportFilePath)) {
  const esLintReportViolations = JSON.parse(fs.readFileSync(esLintReportFilePath, "utf-8"));

  esLintReportViolations.forEach((violation) => {
    const filename = violation.filePath.split('/').pop();
    const messages = violation.messages;

    messages.forEach((message) => {
      const line = message.line;
      const reason = message.message;
      const severity = message.severity;
    
      if (severity === 2) {
        fail(`Eslint: ${reason} in ${filename} on line ${line}`, { file: filename, line: line });
      } else {
        warn(`Eslint: ${reason} in ${filename} on line ${line}`, { file: filename, line: line });
      }
      
    });
  });
}

// Check if ktlint reported any violations

const ktlintReportFilePath = "./demo/demo-app/android/ktlint-output.json";

if (fs.existsSync(ktlintReportFilePath)) {
  const ktlintReportViolations = JSON.parse(fs.readFileSync(ktlintReportFilePath, "utf-8"));

  ktlintReportViolations.forEach((violation) => {
    const filename = violation.file.split('/').pop();
    const errors = violation.errors;

    errors.forEach((error) => {
      const line = error.line;
      const reason = error.message;
    
      fail(`Ktlint: ${reason} in ${filename} on line ${line}`, { file: filename, line: line });
      
    });
  });
}