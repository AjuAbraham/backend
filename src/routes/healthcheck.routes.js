import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controller.js";


const healthcheckRoutes = Router();

healthcheckRoutes.route('/').get(healthcheck);



export default healthcheckRoutes;