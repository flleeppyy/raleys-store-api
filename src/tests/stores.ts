import storeProcessor from "../storesProcessor";
import fs from "fs";
const a = new storeProcessor("https://www.raleys.com/store-locator/?search=all");

async function okay() {
  await a.decompilePage();
  console.log(a.getServices());
  fs.writeFileSync("stores.json", a.toString());
  fs.writeFileSync("storesByService.json", JSON.stringify(a.getStoresByService(['online shopping',  'bakery',
  'cafe',             'deli',
  'hot wok',          'meat',
]), null, 2));
}

okay();
