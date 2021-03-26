module.exports = (connection, client) => {
    const getAverageTimeInSeconds = insertSectionTimes => {
        const timeInSeconds = insertSectionTimes.map(mil => mil / 1000)
        const totalTimeInSeconds = timeInSeconds.reduce( ( a, sec ) => a + sec, 0);
        return `${(totalTimeInSeconds / insertSectionTimes.length).toFixed(2)} seconds`;
    };

    const getAverageTimeInMilliseconds = lookupTimes => {
        const totalTimeInMilliseconds = lookupTimes.reduce( ( a, mil ) => a + mil, 0);
        return `${(totalTimeInMilliseconds / lookupTimes.length)} milliseconds`;
    }

    const generateCustomer = count => {
        const name = 'Zach ' + count;
        const age = Math.floor(Math.random() * 100) + 1;
        const customerId = Math.floor(Math.random() * 1000000) + 1;
        return [ name, age, customerId ];
    }

    const generateUser = count => {
        const name = 'Zach ' + count;
        const age = Math.floor(Math.random() * 100) + 1;
        return [ name, age ];
    }

    const batchInsert = async records => {
        let placeholder = '';
        records.forEach( rec => {
            placeholder += '(?), ';
        })
        placeholder = placeholder.substring(0, placeholder.length - 2);
        return new Promise((resolve) => {
            connection.query(`INSERT INTO test_customer (name, age, customer_id) VALUES ${placeholder};`, records, function (error, results, fields) {
                if(error) console.log(error);
                resolve()
            });
        })
        
    }

    const lookupTimes = {
        redis: [],
        test_users: [],
        test_customer: []
    }

    return {
        insertPgRow: async sql => {
            return new Promise((resolve) => {
                connection.query(sql, (err, result) => resolve(result));
            });
        },
        insertUser: count => {
            const [ name, age ] = generateUser(count);
            return `INSERT INTO test_users (name, age) VALUES ("${name}", ${age});`
        },
        insertCustomer: count => {
            const [ name, age, customerId ] = generateCustomer(count);
            return `INSERT INTO test_customer (name, age, customer_id) VALUES ("${name}", ${age}, ${customerId});`
        },
        getPgRow: async (recordId, tableName) => {
            return new Promise((resolve) => {
                const beforeLookup = new Date().getTime();
                connection.query(`Select * FROM ${tableName} WHERE id = ${recordId}`, (err, result) => {
                    lookupTimes[tableName].push(new Date().getTime() - beforeLookup);
                    resolve(result);
                });
            });
        },
        countQuery: tableName => {
            return `SELECT count(*) from ${tableName};`
        },
        cleanup: tableName => {
            return `TRUNCATE ${tableName};`;
        },
        setReqTimeout: (req, res, next) => {
            req.setTimeout(500 * 1000);
            next();
        },
        prepareStats: (end, start, sectionTimes, recordsToInsert, key = '') => {
            const stats = { 
                recordsInserted: recordsToInsert,
                totalInsertTime: `${((end - start) / 1000).toFixed(2)} seconds`,
                averageInsertTimePer1000Rows: getAverageTimeInSeconds(sectionTimes)
            }
            if(key) {
                stats.averageLookupTime = getAverageTimeInMilliseconds(lookupTimes[key]);
            }

            return stats;
        },
        seedIndexTable: async () => {
            let count = 0;
            let testCustomers = [];
            while(count < 20000000) {
                count++;
                testCustomers.push(generateCustomer(count));
                if(!(count % 10000)) {
                    await batchInsert(testCustomers);
                    testCustomers = [];
                }
            }
        },
        insertRedisUser: async count => {
            return new Promise((resolve) => {
                const [ name, age ] = generateUser(count);
                client.hmset(`user_${count}`, 'name', name, 'age', age);
                const beforeLookup = new Date().getTime();
                client.hgetall(`user_${count}`, (err, reply) => {
                    lookupTimes.redis.push(new Date().getTime() - beforeLookup);
                    resolve();
                })
            })
        } 
    }
}