# Raleys-Store-Api

This is an unofficial store API for raleys.

The way it works is we download the store page and parse it into a Store object.

This is the store object:
```ts
interface Store {
  lat: number;
  lng: number;
  name: string;
  address: string;
  contact_list: {
    label: string;
    phone: string | null;
  }[];
  hours: {
    label: string;
    hours: string[];
  }[];
  services: string[];
  page: string;
  shop?: string;
}
```

This is still a work in progress, and I still have some features I want to add.

- [ ] Ability to sort by city
- [ ] Ability to sort by state
- [ ] Show store id's if possible. (They're in links to store pages but not all stores have them)

## Deployment

1. Clone the repo

```bash
git clone https://github.com/flleeppyy/raleys-store-api.git
```

2. Install dependencies

```bash
yarn install
```

3. Build

```bash
yarn build
```

4. Run
```bash
yarn start
```