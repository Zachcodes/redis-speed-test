const express = require('express');
const mysql = require('mysql');
const app = express();
const utils = require('./utils');
const redis = require("redis");
const client = redis.createClient({ port: 8000 });
const recordsToInsert = 100000;
require('dotenv').config();
const {
    SQL_HOST,
    SQL_DB,
    SQL_PASS,
    SQL_USER
} = process.env;

var connection = mysql.createConnection({
    host: SQL_HOST,
    user: SQL_USER,
    password: SQL_PASS,
    database: SQL_DB
});

connection.connect()

const {
    insertPgRow,
    insertUser,
    insertCustomer,
    countQuery,
    cleanup,
    setReqTimeout,
    prepareStats,
    seedIndexTable,
    insertRedisUser
} = utils(connection, client);

app.post('/pg', setReqTimeout, async (req, res) => {
    let count = 0;
    const startTime = new Date().getTime();
    let baseAverage = new Date().getTime();
    const insertSectionTimes = [];

    while(count < recordsToInsert) {
        count++;
        if(!(count % 1000)) {
            insertSectionTimes.push(new Date().getTime() - baseAverage);
            baseAverage = new Date().getTime();
        }
         
        await insertPgRow(insertUser(count));
    }
    
    const endInsert = new Date().getTime();
    
    connection.query(countQuery('test_users'), function (err, rows) {
        if (err) throw err;
        console.log("Stats for clean table insert\n");
        console.log(prepareStats(endInsert, startTime, insertSectionTimes, recordsToInsert));
        console.log("\n");
        // perform cleanup
        connection.query(cleanup('test_users'), () => res.sendStatus(200));
    });
})

app.post('/pg/index', setReqTimeout, async (req, res) => {
    await seedIndexTable();
    let count = 0;
    const startTime = new Date().getTime();
    let baseAverage = new Date().getTime();
    const insertSectionTimes = [];

    while(count < recordsToInsert) {
        count++;
        if(!(count % 1000)) {
            insertSectionTimes.push(new Date().getTime() - baseAverage);
            baseAverage = new Date().getTime();
        }
        await insertPgRow(insertCustomer(count));
    }
    
    const endInsert = new Date().getTime();
    
    connection.query(countQuery('test_customer'), function (err, rows) {
        if (err) throw err;
        console.log("Stats for indexed table with 1 million initial records\n");
        console.log(prepareStats(endInsert, startTime, insertSectionTimes, recordsToInsert));
        console.log("\n");
        // perform cleanup
        connection.query(cleanup('test_customer'), () => res.sendStatus(200));
    });
})

app.post('/redis', async (req, res) => {
    let count = 0;
    const startTime = new Date().getTime();
    let baseAverage = new Date().getTime();
    const insertSectionTimes = [];

    while(count < recordsToInsert) {
        count++;
        if(!(count % 1000)) {
            insertSectionTimes.push(new Date().getTime() - baseAverage);
            baseAverage = new Date().getTime();
        }

        await insertRedisUser(count);
    }

    const endInsert = new Date().getTime();
    
    console.log("Stats for redis insert\n");
    console.log(prepareStats(endInsert, startTime, insertSectionTimes, recordsToInsert));
    // perform cleanup
    client.flushall(() => res.sendStatus(200));
})






app.listen(4000, () => console.log('Listening on port 4000'));