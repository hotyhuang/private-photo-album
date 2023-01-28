import {TadpolesCrawler} from './tadpoles';

export const handler = () => {
    const crawler = new TadpolesCrawler();
    crawler.start();
};
