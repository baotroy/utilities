import { isAlphabet, stringExplode } from "@/utils";

export enum CaseType {
  Lowercase = "lowercase",
  Uppercase = "uppercase",
  Capitalized = "capitalized",
  Sentence = "sentence",
  Alternating = "alternating",
  Title = "title",
  Inverse = "inverse",
}

export default function convertCase(str: string, type: CaseType): string {
  if (type === "uppercase") return str.toUpperCase();
  if (type === "capitalized")
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  if (type === "sentence") return _sentense(str);
  if (type === "alternating") return convert(str, CaseType.Alternating);
  if (type === "title") return convert(str, CaseType.Title);
  if (type === "inverse") return convert(str, CaseType.Inverse);
  return str.toLowerCase();
}

function convert(str: string, type: CaseType): string {
  const a = stringExplode(str);
  // Loop each line in the array
  for (let i = 0; i < a.length; i++) {
    const original = a[i];
    const line = original.trim();
    if (line.trim() === "") {
      continue;
    }
    if (type === CaseType.Lowercase) {
      const after = _sentense(line);
      // Replace the original line with the new one
      a[i] = original.replace(line, after);
    } else if (type === CaseType.Alternating) {
      a[i] = _alternating(original);
    } else if (type === CaseType.Title) {
      a[i] = _title(original);
    } else if (type === CaseType.Inverse) {
      a[i] = _inverse(original);
    }
  }
  return a.join("\n");
}

function _sentense(str: string): string {
  const cs = str.toLowerCase().split("");

  cs[0] = cs[0].toUpperCase();
  for (let j = 2; j < cs.length; j++) {
    if (!isAlphabet(cs[j])) continue;
    if (cs[j - 1] === " " || cs[j - 1] === ".") {
      cs[j] = cs[j].toUpperCase();
    }
  }
  return cs.join("");
}

function _alternating(str: string): string {
  str = str.toLowerCase();
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);

    if (i % 2 === 1) {
      result += char.toUpperCase();
    } else {
      result += char.toLowerCase();
    }
  }
  return result;
}

// source https://github.com/gouch/to-title-case
function _title(str: string): string {
  str = str.toLowerCase();
  const smallWords =
    /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|v.?|vs.?|via)$/i;
  const alphanumericPattern = /([A-Za-z0-9\u00C0-\u00FF])/;
  const wordSeparators = /([ :–—-])/;

  return str
    .split(wordSeparators)
    .map(function (current, index, array) {
      if (
        /* Check for small words */
        current.search(smallWords) > -1 &&
        /* Skip first and last word */
        index !== 0 &&
        index !== array.length - 1 &&
        /* Ignore title end and subtitle start */
        array[index - 3] !== ":" &&
        array[index + 1] !== ":" &&
        /* Ignore small words that start a hyphenated phrase */
        (array[index + 1] !== "-" ||
          (array[index - 1] === "-" && array[index + 1] === "-"))
      ) {
        return current.toLowerCase();
      }

      /* Ignore intentional capitalization */
      if (current.substr(1).search(/[A-Z]|\../) > -1) {
        return current;
      }

      /* Ignore URLs */
      if (array[index + 1] === ":" && array[index + 2] !== "") {
        return current;
      }

      /* Capitalize the first letter */
      return current.replace(alphanumericPattern, function (match) {
        return match.toUpperCase();
      });
    })
    .join("");
}

function _inverse(str: string): string {
  let convertedString = "";

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    // Convert lowercase to uppercase
    if (char === char.toLowerCase()) {
      convertedString += char.toUpperCase();
    }
    // Convert uppercase to lowercase
    else if (char === char.toUpperCase()) {
      convertedString += char.toLowerCase();
    }
    // Keep non-alphabetic characters unchanged
    else {
      convertedString += char;
    }
  }

  return convertedString;
}
