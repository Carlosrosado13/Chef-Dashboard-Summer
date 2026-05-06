import { pathToFileURL } from "node:url";
import { normalizeMenuRotation } from "./normalizeMenuRotation.js";
import { validateMenuRotation } from "./validateMenuRotation.js";

export function processMenuRotation(rawMenuRotation) {
  const data = normalizeMenuRotation(rawMenuRotation);
  const result = validateMenuRotation(data);

  if (!result.ok) {
    return {
      ok: false,
      errors: result.errors
    };
  }

  return {
    ok: true,
    data
  };
}

function printProcessResult(label, rawMenuRotation) {
  const result = processMenuRotation(rawMenuRotation);

  console.log(`${label}:`);

  if (result.ok) {
    console.log("Menu rotation processed successfully");
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  console.log("Menu rotation processing failed");
  for (const error of result.errors) {
    console.log(`- ${error.message}`);
  }
}

function runCli() {
  const messyValidExample = {
    lunch: {
      "1": {
        " monday ": {
          soup: "  Tomato Soup  ",
          salad: "N/A",
          main1: "Grilled Cheese",
          "MAIN 2": "  Vegetable Pasta ",
          dessert: "Peaches Â and Cream"
        }
      }
    },
    dinner: {
      weeks: {
        "week 2": {
          days: {
            Tuesday: {
              "appetizer 1": "Caesar Salad",
              "APPETIZER_2": "N/A",
              elevated: "Herb Salmon",
              traditional: "Roast Turkey",
              alternative: "Stuffed Pepper",
              veg1: "Green Beans",
              "veg 2": "",
              starch: "Mashed Potatoes",
              dessert: "Apple Crisp"
            }
          }
        }
      }
    }
  };

  const invalidExample = {
    dinner: {
      "1": {
        Friday: {
          entree: "Unmapped Entree",
          starch: "Rice"
        }
      }
    }
  };

  printProcessResult("VALID MENU ROTATION", messyValidExample);
  console.log("");
  printProcessResult("INVALID MENU ROTATION", invalidExample);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
