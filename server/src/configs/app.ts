import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import showRoutes from '../routes/showsRoute.js';
import { join } from 'path';

const app = express();

app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/assets", express.static(join(process.cwd(), "src/assets")))
app.get("/", (_: Request, res: Response)=> res.sendFile(join(process.cwd(), "src/assets/index.html")))
app.use("/show", showRoutes)


export default app;
