import { TadpolesCrawler } from "./tadpoles";

const startDate = process.env.startDate as string;
const endDate = process.env.endDate as string;

const worker = new TadpolesCrawler();
worker.startRunDuring(startDate, endDate);