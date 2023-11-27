import { isAlphabet, stringExplode } from "@/utils";

export enum CaseType {
  Lowercase = "lowercase",
  Uppercase = "uppercase",
  Capitalized = "capitalized",
  Sentence = "sentence",
  Alternating = "alternating",
  Title = "title",
  Inverse = "inverse",
  Rotate = "rotate",
}

export default function convertCase(str: string, type: CaseType): string {
  if (type === CaseType.Uppercase) return str.toUpperCase();
  if (type === CaseType.Capitalized)
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  if (type === CaseType.Sentence) return _sentense(str);
  if (type === CaseType.Alternating) return convert(str, CaseType.Alternating);
  if (type === CaseType.Title) return convert(str, CaseType.Title);
  if (type === CaseType.Inverse) return convert(str, CaseType.Inverse);
  if (type === CaseType.Rotate) return convert(str, CaseType.Rotate);
  return str.toLowerCase();
}

function convert(str: string, type: CaseType): string {
  const a = stringExplode(str);
  // Loop each line in the array
  for (let i = 0; i < a.length; i++) {
    const original = a[i];
   
    if (type === CaseType.Lowercase) {
      const line = original.toLowerCase().trim();
      if (line.trim() === "") {
        continue;
      }
      const after = _sentense(line);
      
      // Replace the original line with the new one
      a[i] = original.replace(line, after);
    } else if (type === CaseType.Alternating) {
      a[i] = _alternating(original);
    } else if (type === CaseType.Title) {
      a[i] = _title(original);
    } else if (type === CaseType.Inverse) {
      a[i] = _inverse(original);
    } else if (type === CaseType.Rotate) {
      a[i] = _rotate(original);
    }
  }
  return a.join("\n");
}

function _sentense(str: string): string {
  const cs = str.toLowerCase().split("");

  cs[0] = cs[0].toUpperCase();
  let dot = false;
  for (let j = 2; j < cs.length; j++) {
    if (cs[j] === ".") dot = true;
    if (!isAlphabet(cs[j])) continue;
    if (dot) {
      cs[j] = cs[j].toUpperCase();
      dot = false;
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
      /**
       * test failed Ddsf  sdf asdf. bdfdsf.sdfsdf.   cdfsd.     ddfs. edf
       * bdfdsf.sdfsdf NOT UPPER CASE b 
       */
      // if (current.substring(1).search(/[A-Z]|\../) > -1) {
      //   return current;
      // }

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

    if (char === char.toLowerCase()) {
      convertedString += char.toUpperCase();
    }
    else if (char === char.toUpperCase()) {
      convertedString += char.toLowerCase();
    }
    else {
      convertedString += char;
    }
  }
  return convertedString;
}

function _rotate(str: string): string{
  return str.split("").reverse().join("");
}

