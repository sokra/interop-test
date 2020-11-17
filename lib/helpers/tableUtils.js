exports.formatTable = (data) => {
  let output = "";

  const header = data[0];
  output += `| ${header.join(" | ")} |\n`;
  output += `| ${header.map(() => "---").join(" | ")} |\n`;
  for (const result of data.slice(1)) {
    output += `| ${result.join(" | ")} |\n`;
  }
  return output;
};

const mergeJsMjs = (items) => {
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const item = items[i];
    if (
      prev.endsWith(" (mjs)") &&
      item.endsWith(" (js)") &&
      prev.slice(0, -6) === item.slice(0, -5)
    ) {
      items.splice(i - 1, 2, prev.slice(0, -6));
      i--;
    }
  }
};

exports.dedupeLines = (data) => {
  const headers = new Map();
  const lines = new Map();
  for (const line of data.slice(1)) {
    const header = line[0];
    const lineData = line.slice(1);
    const key = lineData.join("|");
    let list = headers.get(key);
    if (list === undefined) {
      list = [];
      headers.set(key, list);
      lines.set(key, lineData);
    }
    list.push(header);
  }
  const results = [data[0]];
  for (const [key, headerItems] of headers) {
    mergeJsMjs(headerItems);
    results.push([headerItems.join("<br><br>"), ...lines.get(key)]);
  }
  return results;
};

exports.transpose = (data) => {
  const length = data[0].length;
  const results = [];
  for (let i = 0; i < length; i++) {
    const resultLine = [];
    for (const line of data) {
      resultLine.push(line[i]);
    }
    results.push(resultLine);
  }
  return results;
};
