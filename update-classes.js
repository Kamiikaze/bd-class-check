import fs from "node:fs";
import {glob} from "glob";

async function main() {
  const changesUrl = process.env.CHANGES_URL;
  const filesInput = process.env.FILES_INPUT;

  console.log(`Fetching changes from: ${changesUrl}`);

  // Fetch changes list
  const rawChangesList = await fetch(changesUrl).then((res) => res.text());
  const changesList = rawChangesList
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  console.log(`Found ${changesList.length} change entries`);

  // Combine changes into pairs
  const combinedChangesList = changesList.reduce((acc, line, index) => {
    if (index % 2 === 0 && changesList[index + 1]) {
      acc.push({ oldClass: line, newClass: changesList[index + 1] });
    }
    return acc;
  }, []);

  console.log(`Combined into ${combinedChangesList.length} change pairs`);

  // Filter relevant changes
  const filteredChangeList = combinedChangesList.filter(
    (line) =>
      line.oldClass !== line.newClass &&
      (line.oldClass.includes("_") ||
        line.newClass.includes("_") ||
        line.oldClass.includes("-") ||
        line.newClass.includes("-")),
  );

  console.log(`Filtered to ${filteredChangeList.length} relevant changes`);

  // Create selector map
  const selectorMap = new Map(
    filteredChangeList.map((change) => [`.${change.oldClass}`, change]),
  );

  // Parse files input
  const patterns = filesInput.split(",").map((p) => p.trim());
  const files = [];

  for (const pattern of patterns) {
    if (fs.existsSync(pattern)) {
      const stat = fs.statSync(pattern);
      if (stat.isFile()) {
        files.push(pattern);
      } else if (stat.isDirectory()) {
        const matched = await glob(`${pattern}/**/*.css`, { nodir: true });
        files.push(...matched);
      }
    } else {
      const matched = await glob(pattern, { nodir: true });
      files.push(...matched);
    }
  }

  console.log(`Found ${files.length} files to check`);

  const allDiffs = [];
  const modifiedFiles = new Set();

  // Process each file
  for (const filePath of files) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const fileLines = fileContent.split("\n");
    const classPattern = /\.[\w-_]+/g;
    let modified = false;
    const newLines = [];

    for (let i = 0; i < fileLines.length; i++) {
      let line = fileLines[i];
      const matches = line.match(classPattern);

      if (matches) {
        for (const selector of matches) {
          const change = selectorMap.get(selector);
          if (change) {
            const newSelector = `.${change.newClass}`;
            line = line.replace(selector, newSelector);
            modified = true;

            allDiffs.push({
              file: filePath,
              line: i + 1,
              oldClass: change.oldClass,
              newClass: change.newClass,
            });
          }
        }
      }

      newLines.push(line);
    }

    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, newLines.join("\n"));
      modifiedFiles.add(filePath);
      console.log(`Modified: ${filePath}`);
    }
  }

  console.log(`Total changes: ${allDiffs.length}`);
  console.log(`Modified files: ${modifiedFiles.size}`);

  // Save summary for PR
  const summary = {
    totalChanges: allDiffs.length,
    modifiedFiles: Array.from(modifiedFiles),
    changes: allDiffs,
  };

  fs.writeFileSync("changes-summary.json", JSON.stringify(summary, null, 2));

  if (allDiffs.length === 0) {
    // Don't create an empty summary file
    if (fs.existsSync("changes-summary.json")) {
      fs.rmSync("changes-summary.json");
    }
    return false;
  }

  return allDiffs.length > 0;
}

main()
  .then((hasChanges) => {
    if (hasChanges) {
      process.exit(1); // 1 = changed
    } else {
      process.exit(0); // 0 = no changes
    }
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
