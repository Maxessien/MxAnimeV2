import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import showRoutes from '../routes/showsRoute.js';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/show", showRoutes)


export default app;
