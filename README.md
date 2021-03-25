# Instructions to setup

1. Clone down project, create .env and add the following values ( with appropriate local vals )

```env
SQL_HOST=
SQL_DB=
SQL_PASS=
SQL_USER=
```

2. Open your localhost mysql client, and create two tables. 

- make sure both tables have an autoincrementing index on the pk
- table 1 needs to be called `test_users`
    - column : data type
    - `name` : `VARCHAR`
    - `age`  : `INT`
- table 2 needs to be called `test_customer`
    - column : data type
    - `name` : `VARCHAR`
    - `age`  : `INT`
    - `customer_id` : `INT`

3. Make sure you have installed redis-server locally. If you have not, use these links for mac or linux respectively.

    - [Mac](https://medium.com/@petehouston/install-and-config-redis-on-mac-os-x-via-homebrew-eb8df9a4f298)
    - [Linux](https://redis.io/topics/quickstart)

4. Spin up redis in your terminal using the command `redis-server --port 8000`

5. In seperate terminal, from root of directory, run `node index.js`

6. Lastly, using postman, hit the any of the 3 endpoints in order 

    - http://localhost:4000/pg
    - http://localhost:4000/pg/index
    - http://localhost:4000/redis