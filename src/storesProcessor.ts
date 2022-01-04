import axios from "axios";
import Cheerio from "cheerio";
import { writeFileSync } from "fs";
import logger from "loggers/storeProcessor";

export interface Store {
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

export default class storeProcessor {
  public url: string;
  public stores: Store[];
  public services: string[];
  private processing = false;

  constructor(
    url: string,
    opts: {
      refreshIntervalInHours?: number;
    } = {},
  ) {
    this.url = url;
    this.stores = [];
    this.services = [];

    if (opts.refreshIntervalInHours) {
      setInterval(() => {
        this.decompilePage();
      }, opts.refreshIntervalInHours * 60 * 60 * 1000);
    }
  }

  public async decompilePage() {
    this.processing = true;
    try {
      const response = await axios.get(this.url);
      console.log(response.status);
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      const $ = Cheerio.load(response.data);
      const stores = $(".stores-list").find("li[class='marker']");
      const storeList: Store[] = [];

      stores.each((index, storeElement) => {
        const store = {} as Store;
        store.name = $(storeElement).find(".flex-wrap > h2").text().trim();
        store.address = $(storeElement).find("address").text().trim();
        store.lat = parseFloat($(storeElement).attr("data-lat") as string);
        store.lng = parseFloat($(storeElement).attr("data-lng") as string);
        store.contact_list = [];
        store.hours = [];
        store.services = [];

        $(storeElement)
          .find(".contact-list")
          .find("li")
          .each((index, element) => {
            const label = $(element).first().text().split(":")[0].trim();
            const phone = $(element).find("a").attr("href")?.split("tel://")[1] as string;
            if (phone) {
              store.contact_list.push({
                label,
                phone,
              });
            }

            if (!phone) {
              store.contact_list.push({
                label,
                phone: null,
              });
            }
          });

        $(storeElement)
          .find("div > .box")
          .each((index, infoBox) => {
            if (index === 0) {
              // Hours box
              // There could be multiple sections of hours for different services
              // such as
              /*
            <h3>Store Hours</h3>
            <ul>
              <li>example hours</li>
              <li>example hours</li>
            <ul>
            <h3>Pharmacy Hours</h3>
            <ul>
              <li>example hours</li>
              <li>example hours</li>
            <ul>
            */
              $(infoBox)
                .find("h3")
                .each((index, h3) => {
                  const label = $(h3).text().trim();
                  const hours: string[] = [];
                  $(h3)
                    .next()
                    .find("li")
                    .each((index, li) => {
                      const hour = $(li).text().trim();
                      if (hour.length > 0) {
                        hours.push(hour);
                      }
                    });
                  store.hours.push({
                    label,
                    hours,
                  });
                });
              return;
            }

            if (index === 1) {
              // Services box
              $(infoBox)
                .find("ul")
                .find("li")
                .each((index, element) => {
                  store.services.push($(element).text());
                });
            }
          });

        store.services.forEach((service) => {
          this.addService(service.toLowerCase());
        });

        // go through all anchors and find the one that has innerhtml of "Store Page"
        $(storeElement)
          .find("a")
          .each((index, element) => {
            if ($(element).html() === "Store Page") {
              store.page = $(element).attr("href") as string;
            }
          });

        storeList.push(store);
      });

      this.stores = storeList;
    } catch (error) {
      logger.error(error);
    }
    this.processing = false;
    return this.stores;
  }

  private addService(service: string) {
    if (!this.services.includes(service.toLowerCase())) {
      this.services.push(service.toLowerCase());
    }
  }

  public isProcessing() {
    return this.processing;
  }

  public toString() {
    return JSON.stringify(this.stores, null, 2);
  }

  public getStoresByService(services: string[] | string): Store[] {
    if (services instanceof Array) {
      const newServices = services.map((service) => service.toLowerCase()) as string[];
      newServices.forEach((service) => {
        if (!this.services.includes(service)) {
          throw new Error(`Service ${service} not found`);
        }
      });

      // case insensitive match
      return this.stores.filter((store) => {
        const storeServices = store.services.map((service) => service.toLowerCase());
        return newServices.every((service) => storeServices.includes(service));
      });

    } else {
      if (!this.services.includes(services)) {
        throw new Error(`Service ${services} not found`);
      }
      return this.stores.filter((store) => {
        return store.services.includes(services);
      });
    }


  }

  public getServices() {
    return this.services;
  }
}
