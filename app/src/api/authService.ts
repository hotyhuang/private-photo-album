import Cookie from 'js-cookie';
import { openDB, IDBPDatabase } from 'idb';

export type QuestionType = {
    key: string;
    type?: string;
    label: string;
    description?: string;
    placeholder?: string;
    errorMessage?: string;
};

/**
 * ------------- Start of def ---------------
 * Define client constants for the questions
 * This has to be defined separately, bcs we don't want to expose the answers to client
 */
const ENABLE_QUESTIONAIRE_ACCESS = true;
const QUESTIONS: QuestionType[] = [{
    key: 'name',
    label: 'What is my name?',
    description: 'e.g. Jay Chou, 周杰伦',
    placeholder: 'Enter First and Last name',
}, {
    key: 'dob',
    type: 'date',
    label: 'What is my birth date?',
    description: 'e.g. 12/31/2020',
    placeholder: 'Enter date',
}, {
    key: 'like',
    label: 'What is my favorite toy?',
    placeholder: 'Enter english/chinese name',
}, {
    key: 'poem',
    label: '诗句"卧梅又闻花"想表达什么意思？',
    placeholder: 'Only those humble enough can access this album',
}];
/* ------------- End of def --------------- */


export class AuthDB {
    public db: IDBPDatabase | undefined = undefined;

    public static AUTH_STORE = 'auth_try';

    // an hour
    public static RETRY_TIME_IN_HOUR = 1;
    private static RETRY_TIME_WINDOW = AuthDB.RETRY_TIME_IN_HOUR * 3600 * 1e3;

    public static MAX_TRY = 5;

    async initDB() {
        this.db = await openDB('photo_gallery', 2, {
            upgrade(db) {
                db.createObjectStore(AuthDB.AUTH_STORE, {keyPath: 'timestamp'});
            }
        });
    }

    private async getStore() {
        if (!this.db) {
            await this.initDB();
        }
        return this.db?.transaction(AuthDB.AUTH_STORE, 'readwrite').objectStore(AuthDB.AUTH_STORE);
    }

    async getRetriedTimes() {
        const store = await this.getStore();
        const historyTries = await store?.getAll();

        // remove the old records which are out of the retry window
        const validRetryTimes = historyTries?.filter(({timestamp}) => {
            const inWindow = Date.now() - timestamp < AuthDB.RETRY_TIME_WINDOW;
            if (!inWindow) {
                store?.delete(timestamp);
            }
            return inWindow;
        });

        return validRetryTimes?.length || 0;
    }

    async add() {
        const store = await this.getStore();
        return await store?.add({timestamp: Date.now()});
    }
}

class AuthService {
    private static Answer_Cookie_Key = 'answer';

    private _params: Record<string, string> | undefined = undefined;

    private _authorized = false;

    private _questions = QUESTIONS;

    private idb;

    constructor() {
        this.idb = new AuthDB();
        // init auth
        if (!ENABLE_QUESTIONAIRE_ACCESS) {
            this._authorized = true;
        }

        // init params
        const answersStr = Cookie.get(AuthService.Answer_Cookie_Key);
        if (answersStr) {
            try {
                this._params = JSON.parse(answersStr);
                this._authorized = true;
            } catch (err) {
                console.error('Incorrect format of answers in your cookie.');
            }
        }
    }

    public get params() {
        return this._params;
    }
    public set params(value) {
        if (value) {
            // encode each value, bcs it main contain other languages
            Object.entries(value).forEach(([_k, _v]) => {
                value[_k] = encodeURIComponent(_v);
            });
            // keep cookie for 1 year
            Cookie.set(AuthService.Answer_Cookie_Key, JSON.stringify(value), {expires: 365});
            this._params = value;
            this._authorized = true;
        } else {
            Cookie.remove(AuthService.Answer_Cookie_Key);
            this._params = undefined;
            this._authorized = false;
        }
    }

    public get authorized() {
        return this._authorized;
    }
    public set authorized(value) {
        this._authorized = value;
    }

    public get questions() {
        return this._questions;
    }

    public get hasTriedTimes() {
        return this.idb.getRetriedTimes();
    }
    public async addTryTime() {
        return await this.idb.add();
    }
};

export default new AuthService();