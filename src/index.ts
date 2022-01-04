import Fastify, { FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";
import dotenv from "dotenv";
import generalLogger from "loggers/generalLogger";
dotenv.config();
if (!process.env.PORT) {
  generalLogger.log("error", "No PORT specified in .env file");
  process.exit(1);
}

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify();

import Package from "../package.json";
import storeProcessor, { Store } from "storesProcessor";

const init = async () => {
  const Raleys = new storeProcessor("https://www.raleys.com/store-locator/?search=all", {
    refreshIntervalInHours: 24,
  });
  await Raleys.decompilePage();

  server.get("/", async () => {
    return {
      serviceName: Package.name,
      serviceVersion: Package.version,
      serviceDescription: Package.description,
      fastifyVersion: Package.dependencies.fastify.substr(1),
      nodeVersion: process.version.substring(1),
    };
  });

  /**
   * @api {get} /stores/services Get all services
   * @apiName GetAllServices
   * @apiGroup Stores
   * @apiVersion 1.0.0
   * @apiDescription Returns all services
   * @apiSuccess {String[]} services All services
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *   [
   *    "Online Shopping",
   *    "Gift Cards",
   *    "Gift Shop",
   *    ...
   *  ]
   */
  server.get("/stores/services", async () => {
    return {
      status: "success",
      services: Raleys.getServices(),
    };
  });

  /**
   * @api {get} /stores Get stores
   * @apiName GetStores
   * @apiGroup Stores
   * @apiVersion 1.0.0
   * @apiDescription Returns all stores
   * @apiSuccess {Object[]} stores All stores
   **/
  /**
   * @api {get} /stores Get stores by service with query params
   * @apiName GetStoresByService
   * @apiGroup Stores
   * @apiVersion 1.0.0
   * @apiDescription Returns all stores by service
   * @apiParam {String[]} services Services to filter by
   * @apiSuccess {Object[]} stores All stores by service
   */
  server.get<{
    Querystring: {
      services: string;
    };
  }>("/stores", async (request, reply) => {
    const services = request.query.services ? processParams(request.query.services) : [];
    if (services.length > 0) {
      for (const service of services) {
        if (!Raleys.services.includes(service)) {
          return reply.code(404).send({
            status: "error",
            error: `Service ${service} not found`,
          });
        }
      }
    }

    let result:
      | {
          status: string;
          stores: Store[];
        }
      | {
          status: string;
          error: unknown;
          stacktrace: unknown;
        };
    try {
      result = {
        status: "success",
        stores: services ? Raleys.getStoresByService(services) : Raleys.stores,
      };
    } catch (error) {
      result = {
        status: "error",
        error,
        // @ts-ignore
        stacktrace: error.stack,
      };
      return reply.code(500).send(result);
    }
    return result;
  });

  // TODO: Add store by city
  // this probably wont get done considering theres barely any packages that parse addresses that are ACTIVELY MAINTAINED
  // and libpostal is too much work because you have to COMPILE IT FROM SOURCE and thats a pain
};

function processParams(params: string): string[] {
  // Split params by comma
  const paramsArray = params.split(",");
  // Remove whitespace from each param
  const paramsArrayCleaned = paramsArray.map((param) => param.trim());
  // Remove empty params
  const paramsArrayCleanedFiltered = paramsArrayCleaned.filter((param) => param !== "");
  // lowercase all params
  const paramsArrayCleanedFilteredLowercase = paramsArrayCleanedFiltered.map((param) => param.toLowerCase());
  return paramsArrayCleanedFilteredLowercase;
  // sorry for the terrible variable names. blame copilot
}

const start = async () => {
  try {
    await init();
    await server.listen(process.env.PORT); // FUCK YOU TYPESCRIPT, READ MY GOD DAMN TYPINGS
    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;
    generalLogger.log("info", `Server listening on ${port}`);
  } catch (err) {
    generalLogger.log("error", err);
    process.exit(1);
  }
};
start();
