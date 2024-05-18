#    NodeJs-Database-SelectDB
### What is SelectDB (select-db)? 
- Is Relational Database Files (database management program).
- Can be used as a file system
- is ideal for both small and large applications. 
- Is very fast, reliable, scalable, and easy to use. 
- Is a NoodeJs Framework It will be available in many other programming languages (NodeJs,C++,PHP..) in the future.
- is used for high-volume data storage, helping organizations store large amounts of data while still performing rapidly.

### How does SelectDB work? 
SelectDB environments provide users with a server to create databases with SelectDB.
SelectDB stores data as records that are made up of documents.

### Why is SelectDB used?
An organization might want to use SelectDB for the following:

Storage: SelectDB can store large structured and unstructured data volumes and is scalable vertically and horizontally.
Improve search performance: Searches are also done by ID, Offset, Limit and Condition function.

### The Top Reasons Why You Should Use SelectDB:
- Easy to use
- It saves its data in the smallest memory
- It is characterized by amazing speed in processing orders
- It handles billions of records in less than a second

### 6 query statement in SelectDB:

- INSERT: Creates or inserts a new record.
- SELECT: Select any record.
- SEARCH: Search for anything using the function callback. Filters and query criteria can be applied to search for a specific record.
- UPDATE: Edit specific existing records.
- CHANGE: Replace all specific existing records.
- DELETE: Delete specific existing records.

### The table demonstrates:
Execution time in milliseconds for all function databases for each number of rows
(The average number of characters in the rows of this table is 120 characters per row)

| number of rows |   1   |   10   |  100  | 1000 | 10000 | 100000 | 1000000 
| - | - | - | - | - | - | - | -
|    INSERT 	   |   2   |   5    |   13 	|  118 |  560  |  3422  |  35000  
|    SELECT 	   |   4   |   3 	|    5	|   17 |  101  |  444  	|   4364  
|    SEARCH 	   |   2   |   3 	|    7	|   26 |  132  |  920  	|   8756  
|    UPDATE 	   |   6   |   6 	|   17	|   93 |  491  |  3147  |  31101  
|    CHANGE 	   |   5   |   3 	|    6	|   29 |  279  |  1815  |  17289  
|    DELETE 	   |   5   |   5 	|    8	|   25 |  379  |  1734  |  12650  


Install:
-------

select-db is available on [npm](https://www.npmjs.com/package/select-db). 
It can be installed with the following command:

    npm install select-db

Usage:
-------

We use a CSV file for all the examples below, the URL for this document is here [npm](https://drive.usercontent.google.com/download?id=1NW7EnwxuY6RpMIxOazRVibOYrZfMjsb2&export=download&authuser=0). 

```js

require("select-db")();

```

#### Create DATABASE:
```js

var db = 'db';

const result = createDatabase(db) // db: String includes folder path when you want to create your database
// result -> {statement : true}
```

#### Create Table:
```js

var db = 'db', tbl = 'table';

createTable(db, table,clmn,dflt)
// db: String includes folder path when you want to create your database
// db: String includes folder path when you want to create your table 
// clmn: Column names
// dflt: default values for columns
```

###### Table creation example:
```js

const result = createTable(db, tbl, [ 'Index', 'User Id', 'First Name', 'Last Name', 'Sex','Email','Phone','Date of birth','Job Title' ],
								[ '_idx', 'u_id', 'f_name', 'l_name', '_sex','_email','_phone','d_birth','j_title' ]
					)
// result -> { time: '4 ms', statement: true }

```

### Connect Database:
```js

var db = 'db';

var dBase = connectDB(db)
// dBase -> object

```

#### INSERT Statement:
We have insert ,insertMany and insertCsv.

1 -insert:
```js

dBase.insert(table,clmn,vals)
// clmn: Column names
// vals: Values for columns

```

###### Examples of insert statement:
```js

const tbl = 'table';

var objRows = dBase.insert(tbl, [ 'Index', 'User Id', 'First Name', 'Last Name' ],
								[ 1, 'kdhlfi24ak', 'houss', 'cher' ])
// objRows ->  { time: '4 ms', count: 1, id: 1 }

objRows = dBase.insert(tbl, [ 'Index', 'User Id', 'First Name', 'Last Name' ],
								[ 2, 'hdyzrl58kf', 'amin', 'sahli' ])
// objRows ->  { time: '3 ms', count: 1, id: 2 }

```

2 -insertMany:
```js

dBase.insertMany(table,clmn,vals)
// clmn: Column names
// vals: Values for columns (Two-dimensional array)

```

###### Examples of insertMany statement:
```js

const tbl = 'table';

var objRows = dBase.insertMany(tbl, [ 'Index', 'User Id', 'First Name', 'Last Name', 'Sex' ],
								[
								[1,"5f10e9D33fC5f2b","Sara","Mcguire","Female"],
								[2,"751cD1cbF77e005","Alisha","Hebert","Male"],
								[3,"DcEFDB2D2e62bF9","Gwendolyn","Sheppard","Male"],
								[4,"C88661E02EEDA9e","Kristine","Mccann","Female"]
								])
// objRows ->  { time: '4 ms', count: 4, id: 4 } 

```

3 -insertCsv:
we have two methodes (.chunk and .rowOffset)

```js

dBase.insertCsv(table, csvFP, clmn, option);
// csvFP: 'file_path.csv'
// clmn : Column names
// option : Optional parameter
/* The default object option :
	option: {
	  'header': true,    		 or false 
	  'quote': false,      		 or true 
	  'linebreak': '\r\n',  	 '\n' or '\r' or any other string  
	  'delimiter': ","    		 ';' or any other string or false 
	  'bufferSize':1024*1024   	
	}

// delimiter: (String: get rows containing columns, false: get lines without columns)
// bufferSize: It only works with a CSV file, which is the maximum number of characters that can be read at a time, the minimum value is 1024
*/
```

A- Chunk methode (.chunk):
```js

var iCsv = dBase.insertCsv(table, csvFP, clmn, option);

var objRows = iCsv.chunk(n)
// The 'n' parameter must be an integer and greater than or equal to 1 (n rows)
```

###### Examples of chunk methode statement:
```js
const tbl = 'table';

var iCsv = dBase.insertCsv(tbl, 'people-10000.csv',[ 'Index', 'User Id', 'First Name', 'Last Name', 'Sex','Email','Phone','Date of birth','Job Title' ]);

var objRows = iCsv.chunk(1000)
// objRows -> { time: '109 ms', count: 1000, id: 1000 }

objRows = iCsv.chunk(30)
// objRows -> { time: '11 ms', count: 30, id: 1030 }

```

B- Row Offset methode (.rowOffset):
```js

var iCsv = dBase.insertCsv(table, csvFP, clmn, option);

var objRows = iCsv.rowOffset(from,to)
// The 'from' parameter must be an integer and greater than or equal to 0
// The 'to' parameter must be an integer and greater than or equal to 1 and greater than the 'from' parameter

```

###### Examples of Row Offset methode statement:
```js
const tbl = 'table';

var iCsv = dBase.insertCsv(tbl, 'people-10000.csv',[ 'Index', 'User Id', 'First Name', 'Last Name', 'Sex','Email','Phone','Date of birth','Job Title' ]);

objRows = iCsv.rowOffset(2015,2015+250)
// objRows -> { time: '22 ms', count: 250, id: 1280 }

```

## SELECT Statement:
We have select and selectIn.

1 -select:
```js

dBase.select(table,id,offset,limit,clmn)
// id: must be equal to or greater than zero
// offset: must be greater or less than 0 or this "+" or "-" character
// limit: must be equal to or greater than zero
// clmn :Column names


```

### Explanation of various situations (16 cases):
```diff

	(id,offset,limit)
	-----------------

	1- case : id>0 ,offset>0 and limit>0
		-> (7,5,2) Gets rows 7 to 11 by limiting just 2 rows in ascending order : 7,8.

	2- case : id>0 ,offset>0 and limit=0
		-> (7,5,0) Gets rows 7 to 11 in ascending order : 7,8,9,10,11.

	3- case : id>0 ,offset<0 and limit>0
		-> (19,-6,3) Gets rows 19 to 14 by limiting just 3 rows in descending order : 19,18,17.

	4- case : id>0 ,offset<0 and limit=0
		-> (19,-6,0) Gets rows 19 to 14 in descending order : 19,18,17,16,15,14.

	5- case : id>0 ,offset='+' and limit>0
		-> (7,'+',2) Gets the rows from 7 to the last row by limiting just 2 rows in ascending order : 7,8.

	6- case : id>0 ,offset='+' and limit=0
		-> (7,'+',0) Gets the rows from 7 to last row in ascending order : 7,8,9, ..... ,lastId.

	7- case : id>0 ,offset='-' and limit>0
		-> (19,'-',3) Gets rows 19 to first row by limiting just 3 rows in descending order : 19,18,17.

	8- case : id>0 ,offset='-' and limit=0
		-> (19,'-',0) Gets rows from 19 to the first row in descending order : 19,18,17, ..... ,1.

	-------------------------------------------------------
	* If id equal to 0 : Start from the last row (lastId)
	-------------------------------------------------------
	
	9- case : id=0 ,offset>0 and limit>0
		-> (0,5,2) Get only the last row : lastId.

	10- case : id=0 ,offset>0 and limit=0
		-> (0,5,0) Get only the last row : lastId.

	11- case : id=0 ,offset<0 and limit>0
		-> (0,-6,3) Gets the rows from last row to lastId-6 row by limiting just 3 rows in descending order : lastId,lastId-1,lastId-2.

	12- case : id=0 ,offset<0 and limit=0
		-> (0,-6,0) Gets the rows from last row to the lastId-6 row in descending order : lastId,lastId-1, ..... ,1.

	13- case : id=0 ,offset='+' and limit>0
		-> (0,'+',20) Get only the last row :lastId.

	14- case : id=0 ,offset='+' and limit=0
		-> (0,'+',0) Get only the last row :lastId.

	15- case : id=0 ,offset='-' and limit>0
		-> (0,'-',3) Gets rows from last row to first row by limiting just 3 rows in descending order : lastId,lastId-1,lastId-2.

	16- case : id=0 ,offset='-' and limit=0
		-> (0,'-',0) Gets rows from from last row to the first row in descending order : lastId,lastId-1,.....,1.

```

###### Examples of select statement:
```js

const tbl = 'table';

var objRows =dBase.select(tbl,16,2,0, '*');
/* objRows -> 
{
  time: '3 ms',
  count: 2,
  rows: [
    {
      id: 16,
      Index: '16',
      'User Id': 'Fec6b46586ad5ab',
      'First Name': 'Bradley',
      'Last Name': 'Bright',
      Sex: 'Female',
      Email: 'devinherman@example.net',
      Phone: '2534420151',
      'Date of birth': '1992-01-27',
      'Job Title': 'Fitness centre manager'
    },
    {
      id: 17,
      Index: '17',
      'User Id': 'd8CF9ED8c6E5b0b',
      'First Name': 'Ernest',
      'Last Name': 'Maynard',
      Sex: 'Male',
      Email: 'tommywoodard@example.com',
      Phone: '355-863-2311x6315',
      'Date of birth': '2017-11-23',
      'Job Title': '"Accountant, chartered certified"'
    }
  ]
}
*/

objRows =dBase.select(tbl,25,10,3, '*');
/* objRows -> 
{
  time: '2 ms',
  count: 3,
  rows: [
    {
      id: 25,
      Index: '25',
      'User Id': 'f628DfBb03CBD1F',
      'First Name': 'Meghan',
      'Last Name': 'Blanchard',
      Sex: 'Male',
      Email: 'smejia@example.org',
      Phone: '+1-188-201-3028x13440',
      'Date of birth': '1927-08-24',
      'Job Title': 'Occupational therapist'
    },
    {
      id: 26,
      Index: '26',
      'User Id': '39Aded2dba9D2dA',
      'First Name': 'Julie',
      'Last Name': 'Delacruz',
      Sex: 'Male',
      Email: 'jillian34@example.net',
      Phone: '903.237.1120x705',
      'Date of birth': '1941-04-10',
      'Job Title': 'Television production assistant'
    },
    {
      id: 27,
      Index: '27',
      'User Id': 'ab6F7E1f5F3f4cb',
      'First Name': 'Jackie',
      'Last Name': 'Munoz',
      Sex: 'Male',
      Email: 'villarrealgilbert@example.org',
      Phone: '+1-460-150-7613',
      'Date of birth': '1969-08-04',
      'Job Title': '"Development worker, community"'
    }
  ]
}
*/

objRows =dBase.select(tbl,25,-10,3, ['Index', 'User Id', 'First Name', 'Last Name', 'Sex']);
/* objRows -> 
{
  time: '2 ms',
  count: 3,
  rows: [
    {
      id: 25,
      Index: '25',
      'User Id': 'f628DfBb03CBD1F',
      'First Name': 'Meghan',
      'Last Name': 'Blanchard',
      Sex: 'Male'
    },
    {
      id: 24,
      Index: '24',
      'User Id': 'F0e6bBAfFAeE76E',
      'First Name': 'Cindy',
      'Last Name': 'Haynes',
      Sex: 'Female'
    },
    {
      id: 23,
      Index: '23',
      'User Id': 'Ccee761Bfb157db',
      'First Name': 'Jermaine',
      'Last Name': 'Liu',
      Sex: 'Male'
    }
  ]
}
*/
```

2 -selectIn:
```js

dBase.selectIn(table,ids,limit,clmn)
// ids: ids must be an array of numbers [5,30,56,1025,......]
// limit: must be equal to or greater than zero
// clmn :Column names

```

###### Examples of selectIn statement:
```js

const tbl = 'table';

var objRows =dBase.selectIn(tbl,[11,25,62],0, ['Index','User Id']);
/* objRows -> 
{
  time: '3 ms',
  count: 3,
  rows: [
    { id: 11, Index: '11', 'User Id': 'FEf0Cc496EB4bC0' },
    { id: 25, Index: '25', 'User Id': 'f628DfBb03CBD1F' },
    { id: 62, Index: '62', 'User Id': 'Ad07d6Bcc2bbe9f' }
  ]
}
*/

objRows =dBase.selectIn(tbl,[62,16,32,22,90],2, ['Index','User Id','First Name', 'Last Name']);
/* objRows -> 
{
  time: '3 ms',
  count: 2,
  rows: [
    {
      id: 62,
      Index: '62',
      'User Id': 'Ad07d6Bcc2bbe9f',
      'First Name': 'Beverly',
      'Last Name': 'Sanford'
    },
    {
      id: 16,
      Index: '16',
      'User Id': 'Fec6b46586ad5ab',
      'First Name': 'Bradley',
      'Last Name': 'Bright'
    }
  ]
}
*/
```

### SEARCH Statement:
We have search and searchIn.

1 -search:
```js

dBase.search(table, id, offset, limit, clmn, coClmn, chekCond)
// id: must be equal to or greater than zero
// offset: must be greater or less than 0 or this "+" or "-" character
// limit: must be equal to or greater than zero
// clmn :Column names
// coClmn : Column names for condition
// chekCond : Callback function to check the condition in coClmn with 4 parameters chekCond(id,clmn, coClmn, get)

// chekCond(id,clmn, coClmn, get) get: is an object to add what do you want
```


###### Examples of search statement:
```js

const tbl = 'table';

function chekCond(id,clmn,coClmn,get){
  if(coClmn['First Name'].indexOf('Claudia')!=-1)
    return true;
}
objRows =dBase.search(tbl,22,"+",4, ['Index','User Id','First Name', 'Last Name'],['First Name'],chekCond);
/* objRows -> 
{
  time: '56 ms',
  count: 4,
  rows: [
    {
      id: 1082,
      Index: '2067',
      'User Id': 'FefA71f7522adc6',
      'First Name': 'Claudia',
      'Last Name': 'Mays',
      get: {}
    },
    {
      id: 2362,
      Index: '2067',
      'User Id': 'FefA71f7522adc6',
      'First Name': 'Claudia',
      'Last Name': 'Mays',
      get: {}
    },
    {
      id: 3642,
      Index: '2067',
      'User Id': 'FefA71f7522adc6',
      'First Name': 'Claudia',
      'Last Name': 'Mays',
      get: {}
    },
    {
      id: 4922,
      Index: '2067',
      'User Id': 'FefA71f7522adc6',
      'First Name': 'Claudia',
      'Last Name': 'Mays',
      get: {}
    }
  ]
}
*/

function chekCond2(id,clmn,coClmn,get){
  if(coClmn['First Name'].indexOf('ana')!=-1){
    clmn["Full Name"] = clmn["First Name"] + ' ' + clmn["Last Name"]
    return true;
  }
}
objRows =dBase.search(tbl,0,"-",3, ['Index','User Id','First Name', 'Last Name'],['First Name'],chekCond2);
/* objRows ->
 {
  time: '7 ms',
  count: 3,
  rows: [
    {
      id: 16543,
      Index: '2168',
      'User Id': 'ACceB43B0AC5bc4',
      'First Name': 'Dana',
      'Last Name': 'Phelps',
      'Full Name': 'Dana Phelps',
      get: {}
    },
    {
      id: 16487,
      Index: '2112',
      'User Id': 'B14a40dF4f7fFEE',
      'First Name': 'Adriana',
      'Last Name': 'Hawkins',
      'Full Name': 'Adriana Hawkins',
      get: {}
    },
    {
      id: 16280,
      Index: '920',
      'User Id': '39686fAAE3c0baE',
      'First Name': 'Adriana',
      'Last Name': 'Cochran',
      'Full Name': 'Adriana Cochran',
      get: {}
    }
  ]
}*/

function chekCond3(id,clmn,coClmn,get){
  if(coClmn['Sex']=="Male"){
    clmn["Full Name"] = clmn["First Name"] + ' ' + clmn["Last Name"]
    clmn["My sex"] = "I'm a man"
    return true;
  }
}
objRows =dBase.search(tbl,156,"+",3, ['Index','User Id','First Name', 'Last Name'],['Sex'],chekCond3);
/* objRows ->
{
  time: '2 ms',
  count: 3,
  rows: [
    {
      id: 157,
      Index: '157',
      'User Id': '7aa9A8e7d6b2d2a',
      'First Name': 'Bobby',
      'Last Name': 'Mathis',
      'Full Name': 'Bobby Mathis',
      'My sex': "I'm a man",
      get: {}
    },
    {
      id: 163,
      Index: '163',
      'User Id': 'cCe8bFd14f2BFa0',
      'First Name': 'Malik',
      'Last Name': 'Mclaughlin',
      'Full Name': 'Malik Mclaughlin',
      'My sex': "I'm a man",
      get: {}
    },
    {
      id: 165,
      Index: '165',
      'User Id': 'ab215e68EACD0F9',
      'First Name': 'Chris',
      'Last Name': 'Lucero',
      'Full Name': 'Chris Lucero',
      'My sex': "I'm a man",
      get: {}
    }
  ]
}
*/
```

2 -searchIn:
```js

dBase.searchIn(table, ids, limit, clmn, coClmn, chekCond)
// ids: ids must be an array of numbers [9,68,200,8,......]
// limit: must be equal to or greater than zero
// clmn :Column names
// coClmn : Column names for condition
// chekCond : Callback function to check the condition in coClmn with 4 parameters chekCond(id,clmn, coClmn, get)

// chekCond(id,clmn, coClmn, get) get: is an object to add what do you want
```

###### Examples of searchIn statement:
```js

const tbl = 'table';

function chekCond(id,clmn,coClmn,get){
  if(coClmn['Sex']=="Male"){
    clmn["Full Name"] = clmn["First Name"] + ' ' + clmn["Last Name"]
    clmn["My sex"] = "I'm a man"
    return true;
  }
}
objRows =dBase.searchIn(tbl,[156,6,30,1000,2,10586],0, ['Index','User Id','First Name', 'Last Name'],['Sex'],chekCond);
/* objRows ->
{
  time: '5 ms',
  count: 2,
  rows: [
    {
      id: 2,
      Index: '2',
      'User Id': '751cD1cbF77e005',
      'First Name': 'Alisha',
      'Last Name': 'Hebert',
      'Full Name': 'Alisha Hebert',
      'My sex': "I'm a man",
      get: {}
    },
    {
      id: 10586,
      Index: '346',
      'User Id': 'ECd9Aa81a2F910E',
      'First Name': 'Kristin',
      'Last Name': 'Bush',
      'Full Name': 'Kristin Bush',
      'My sex': "I'm a man",
      get: {}
    }
  ]
}
*/
```

### UPDATE Statement:
We have update, updateIf updateIn and updateInIf.

1 -update:
```js

dBase.update(table, id, offset, limit, clmn, vals)
// id: must be equal to or greater than zero
// offset: must be greater or less than 0 or this "+" or "-" character
// limit: must be equal to or greater than zero
// clmn :Column names
// vals: Update existing records with new values 
```

###### Examples of update statement:
```js
const tbl = 'table';

objRows =dBase.update(tbl,253,"+",2, ['First Name', 'Last Name','Job Title'],['Housseyn','Cheriet','Software developer']);
/* objRows -> 
{ time: '6 ms', count: 2 }
*/

// let's check my update
objRows =dBase.select(tbl,253,"+",2, ['First Name', 'Last Name','Job Title']);
/* objRows -> 
{
  time: '2 ms',
  count: 2,
  rows: [
    {
      id: 253,
      'First Name': 'Housseyn',
      'Last Name': 'Cheriet',
      'Job Title': 'Software developer'
    },
    {
      id: 254,
      'First Name': 'Housseyn',
      'Last Name': 'Cheriet',
      'Job Title': 'Software developer'
    }
  ]
}
*/
```

2 -updateIf:
```js

dBase.updateIf(table, id, offset, limit, clmn, coClmn, chekCond)
// id: must be equal to or greater than zero
// offset: must be greater or less than 0 or this "+" or "-" character
// limit: must be equal to or greater than zero
// clmn :Column names
// coClmn : Column names for condition
// chekCond : Callback function to check the condition in coClmn with 3 parameters chekCond(id,clmn, coClmn)

// chekCond(id,clmn, coClmn, get) get: is an object to save what do you want
```

###### Examples of updateIf statement:
```js
const tbl = 'table';

function chekCond(id,clmn,coClmn){
  if(coClmn['Sex']=="Male"){
    clmn["Sex"] = clmn["Sex"] + ": I'm a man"  
  }
  else if(coClmn['Sex']=="Female"){
  	clmn["Sex"] = clmn["Sex"] + ": I'm a woman"  
  } 
  return true;
}
objRows =dBase.updateIf(tbl,22,3,0, ['Sex'],['Sex'],chekCond);
/* objRows -> 
 { time: '7 ms', count: 3 }
*/

// let's check my update
objRows =dBase.select(tbl,253,"+",2, ['First Name', 'Last Name','Job Title']);
/* objRows -> 
{
  time: '2 ms',
  count: 3,
  rows: [
    {
      id: 22,
      'First Name': 'Marco',
      'Last Name': 'Sharp',
      Sex: "Male: I'm a man"
    },
    {
      id: 23,
      'First Name': 'Jermaine',
      'Last Name': 'Liu',
      Sex: "Male: I'm a man"
    },
    {
      id: 24,
      'First Name': 'Cindy',
      'Last Name': 'Haynes',
      Sex: "Female: I'm a woman"
    }
  ]
}
*/
```

3,4 - updateIn and updateInIf are like update and updateIf , just replace id with ids array without using offset

```js

dBase.updateIn(table, ids, limit, clmn, vals)
// ids: ids must be an array of numbers [5,8,9,100,4,......]
// limit: must be equal to or greater than zero
// clmn :Column names
// vals: Update existing records with new values

dBase.updateInIf(table, ids, limit, clmn, coClmn, chekCond)
// ids: ids must be an array of numbers [5,8,9,100,4,......]
// limit: must be equal to or greater than zero
// clmn :Column names
// coClmn : Column names for condition
// chekCond : Callback function to check the condition in coClmn with 3 parameters chekCond(id,clmn, coClmn)
```

###### Examples of updateIn and updateInIf statement:
```js
const tbl = 'table';

objRows =dBase.updateIn(tbl,[22,60,5,96,8],2, ['First Name', 'Last Name','Job Title'],['Housseyn','Cheriet','Software developer']);
/* objRows -> 
{ time: '6 ms', count: 2 }
*/

function chekCond(id,clmn,coClmn){
  if(coClmn['Sex']=="Male"){
    clmn["Sex"] = clmn["Sex"] + ": I'm a man"  
  }
  else if(coClmn['Sex']=="Female"){
  	clmn["Sex"] = clmn["Sex"] + ": I'm a woman"  
  } 
  return true;
}
objRows =dBase.updateInIf(tbl,[22,60,5,96,8],0, ['Sex'],['Sex'],chekCond);
/* objRows -> 
 { time: '7 ms', count: 5 }
*/


```

### CHANGE Statement:
Changing the entire record means clearing all the row columns and editing them again as if you were saving for the first time.
We have change, changeIf changeIn and changeInIf.

1 -change:
```js

dBase.change(table, id, offset, limit, clmn, vals)
// id: must be equal to or greater than zero
// offset: must be greater or less than 0 or this "+" or "-" character
// limit: must be equal to or greater than zero
// clmn :Column names
// vals: Changing the entire existing records with new values 
```

###### Examples of change statement:
```js
const tbl = 'table';

// Let's see before we change:
objRows =dBase.select(tbl,11,"+",1, "*");
/* objRows -> 
{
  time: '2 ms',
  count: 1,
  rows: [
    {
      id: 11,
      Index: '11',
      'User Id': 'FEf0Cc496EB4bC0',
      'First Name': 'Jean',
      'Last Name': 'Aguilar',
      Sex: 'Male',
      Email: 'raymond24@example.org',
      Phone: '(285)029-1604x5466',
      'Date of birth': '1978-10-28',
      'Job Title': '"Engineer, control and instrumentation"'
    }
  ]
}
*/

objRows =dBase.change(tbl,11,"+",1, ['First Name', 'Last Name'],['First Name changed','Last Name changed']);
/* objRows -> 
{ time: '2 ms', count: 1 }
*/

// let's check my update
objRows =dBase.select(tbl,11,"+",1, "*");
/* objRows -> 
{
  time: '2 ms',
  count: 1,
  rows: [
    {
      id: 11,                       <- This is a default value only                        
      Index: '_idx',                <- This is a default value only  
      'User Id': 'u_id',            <- This is a default value only  
      'First Name': 'First Name changed',
      'Last Name': 'Last Name changed',
      Sex: '_sex',                  <- This is a default value only  
      Email: '_email',              <- This is a default value only  
      Phone: '_phone',              <- This is a default value only  
      'Date of birth': 'd_birth',   <- This is a default value only  
      'Job Title': 'j_title'        <- This is a default value only  
    }
  ]
}
*/

```

2 -changeIf:
```js

dBase.changeIf(table, id, offset, limit, clmn, chekCond)
// id: must be equal to or greater than zero
// offset: must be greater or less than 0 or this "+" or "-" character
// limit: must be equal to or greater than zero
// clmn :Column names
// chekCond : Callback function to check the condition in coClmn with 3 parameters chekCond(id,clmn, coClmn)
```

###### Examples of changeIf statement:
```js
function chekCond(id,clmn,coClmn){
  if(coClmn['Sex']=="Male"){
    clmn["Sex"] = "Changed : I'm a man"  
  }
  else if(coClmn['Sex']=="Female"){
    clmn["Sex"] = "Changed: I'm a woman"  
  } 
  return true;
}
objRows =dBase.changeIf(tbl,30,1,0, ['Sex'],['Sex'],chekCond);
/* objRows -> 
 { time: '3 ms', count: 1 }
*/

// let's check my change
objRows =dBase.select(tbl,30,"+",1, "*");
/* objRows -> 
{
  time: '1 ms',
  count: 1,
  rows: [
    {
      id: 30,                       <- This is a default value only
      Index: '_idx',                <- This is a default value only
      'User Id': 'u_id',            <- This is a default value only
      'First Name': 'f_name',       <- This is a default value only
      'Last Name': 'l_name',        <- This is a default value only
      Sex: "Changed: I'm a woman",  
      Email: '_email',              <- This is a default value only
      Phone: '_phone',              <- This is a default value only
      'Date of birth': 'd_birth',   <- This is a default value only
      'Job Title': 'j_title'        <- This is a default value only
    }
  ]
}
*/
```

3,4 - changeIn and changeInIf are like change and changeIf , just replace id with ids array without using offset
```js

dBase.changeIn(table, ids, limit, clmn, vals)
// ids: ids must be an array of numbers [5,8,9,100,4,......]
// limit: must be equal to or greater than zero
// clmn :Column names
// vals: Changing the entire existing records with new values 

dBase.changeInIf(table, ids, limit, clmn, coClmn, chekCond)
// ids: ids must be an array of numbers [5,8,9,100,4,......]
// limit: must be equal to or greater than zero
// clmn :Column names
// coClmn : Column names for condition
// chekCond : Callback function to check the condition in coClmn with 3 parameters chekCond(id,clmn, coClmn)
```

###### Examples of changeIn and changeInIf statement:
```js
const tbl = 'table';

objRows =dBase.changeIn(tbl,[22,60,5,96,8],2, ['First Name', 'Last Name','Job Title'],['Housseyn','Cheriet','Software developer']);
/* objRows -> 
{ time: '5 ms', count: 2 }
*/

function chekCond(id,clmn,coClmn){
  clmn["Job Title"] = "Changed : I'm unemployed"  

  if(coClmn['Sex']=="Male"){
    clmn["Sex"] = "Changed : I'm a man"  
  }
  else if(coClmn['Sex']=="Female"){
    clmn["Sex"] = "Changed: I'm a woman"  
  } 
  return true;
}
objRows =dBase.changeInIf(tbl,[22,60,5],0, ['Sex','Job Title'],['Sex'],chekCond);
/* objRows -> 
 { time: '8 ms', count: 5 }
*/

// let's check my change
objRows =dBase.selectIn(tbl,[22,60,5],0, "*");
/* objRows ->
{
  time: '1 ms',
  count: 3,
  rows: [
    {
      id: 22,                       <- This is a default value only
      Index: '_idx',                <- This is a default value only
      'User Id': 'u_id',            <- This is a default value only
      'First Name': 'f_name',       <- This is a default value only
      'Last Name': 'l_name',        <- This is a default value only
      Sex: "Changed : I'm a man",
      Email: '_email',              <- This is a default value only
      Phone: '_phone',              <- This is a default value only
      'Date of birth': 'd_birth',   <- This is a default value only
      'Job Title': "Changed : I'm unemployed"
    },
    {
      id: 60,
      Index: '_idx',
      'User Id': 'u_id',
      'First Name': 'f_name',
      'Last Name': 'l_name',
      Sex: "Changed : I'm a man",
      Email: '_email',
      Phone: '_phone',
      'Date of birth': 'd_birth',
      'Job Title': "Changed : I'm unemployed"
    },
    {
      id: 5,
      Index: '_idx',
      'User Id': 'u_id',
      'First Name': 'f_name',
      'Last Name': 'l_name',
      Sex: "Changed: I'm a woman",
      Email: '_email',
      Phone: '_phone',
      'Date of birth': 'd_birth',
      'Job Title': "Changed : I'm unemployed"
    }
  ]
}
*/

```

### DELETE Statement:
Romove the entire record.
We have change, changeIf changeIn and changeInIf.

1 -delete:
```js

dBase.delete(table, id, offset, limit)
// id: must be equal to or greater than zero
// offset: must be greater or less than 0 or this "+" or "-" character
// limit: must be equal to or greater than zero

```

###### Examples of delete statement:
```js
const tbl = 'table';

objRows =dBase.delete(tbl,27,5,0);
/* objRows -> 
{ time: '3 ms', count: 5 }
*/

// let's check my delete
objRows =dBase.select(tbl,26,"+",2, "*");
/* objRows -> 
{
  time: '2 ms',
  count: 2,
  rows: [
    {
      id: 26,
      Index: '26',
      'User Id': '39Aded2dba9D2dA',
      'First Name': 'Julie',
      'Last Name': 'Delacruz',
      Sex: 'Male',
      Email: 'jillian34@example.net',
      Phone: '903.237.1120x705',
      'Date of birth': '1941-04-10',
      'Job Title': 'Television production assistant'
    },  
    		<----------- The record with ids 27,28,29,30 and 31 was deleted
    {
      id: 32,
      Index: '32',
      'User Id': 'd82e9C3dE3bca25',
      'First Name': 'Melody',
      'Last Name': 'Wiggins',
      Sex: 'Male',
      Email: 'mackrachael@example.net',
      Phone: '138-424-2414x284',
      'Date of birth': '1938-05-08',
      'Job Title': 'Fitness centre manager'
    }
  ]
}
*/
```

2 -deleteIf:
```js

dBase.deleteIf(table, id, offset, limit, coClmn, chekCond)
// id: must be equal to or greater than zero
// offset: must be greater or less than 0 or this "+" or "-" character
// limit: must be equal to or greater than zero
// coClmn : Column names for condition
// chekCond : Callback function to check the condition in coClmn with 2 parameters chekCond(id, coClmn)
```

###### Examples of deleteIf statement:
```js

function chekCond(id,coClmn){
  if(Number(coClmn['Index']) %2 == 1){
    return true;
  }
}
objRows =dBase.deleteIf(tbl,42,5,0,['Index'],chekCond);
/* objRows -> 
 { time: '3 ms', count: 2 }
*/

// let's check my delete
objRows =dBase.select(tbl,42,5,0, "*");
/* objRows -> 
{
  time: '1 ms',
  count: 3,
  rows: [
    {
      id: 42,
      Index: '42',
      'User Id': '433902DadEEEC75',
      'First Name': 'Tom',
      'Last Name': 'Rivas',
      Sex: 'Male',
      Email: 'guyayers@example.org',
      Phone: '+1-382-207-6922',
      'Date of birth': '2019-05-16',
      'Job Title': 'Medical technical officer'
    },
    			<----------- The record with id 43 was deleted (43%2 == 1)
    {
      id: 44,
      Index: '44',
      'User Id': 'dCfa25BcbcAba3e',
      'First Name': 'Denise',
      'Last Name': 'Cardenas',
      Sex: 'Male',
      Email: 'sethtrujillo@example.com',
      Phone: '(361)504-1387x66414',
      'Date of birth': '1979-12-04',
      'Job Title': 'Customer service manager'
    },
    			<----------- The record with id 45 was deleted (45%2 == 1)
    {
      id: 46,
      Index: '46',
      'User Id': '0Bda3Ed3024eA18',
      'First Name': 'Curtis',
      'Last Name': 'Oconnell',
      Sex: 'Female',
      Email: 'katie30@example.com',
      Phone: '049.991.7021x207',
      'Date of birth': '1929-01-03',
      'Job Title': 'Print production planner'
    }
  ]
}
*/
```

3,4 - deleteIn and deleteInIf are like delete and deleteIf , just replace id with ids array without using offset
```js

dBase.deleteIn(table, ids, limit)
// ids: ids must be an array of numbers [5,8,9,100,4,......]
// limit: must be equal to or greater than zero

dBase.deleteInIf(table, ids, limit, coClmn, chekCond)
// ids: ids must be an array of numbers [5,8,9,100,4,......]
// limit: must be equal to or greater than zero
// coClmn : Column names for condition
// chekCond : Callback function to check the condition in coClmn with 2 parameters chekCond(id, coClmn)

```

###### Examples of deleteIn and deleteInIf statement:
```js
const tbl = 'table';

objRows =dBase.deleteIn(tbl,[3,7,9],0);
/* objRows -> 
{ time: '5 ms', count: 2 }
*/

function chekCond(id,coClmn){
  if(coClmn['Sex']=="Female"){
    return true; 
  }  
}
objRows =dBase.deleteInIf(tbl,[62,63,64,65,66],0, ['Sex'],chekCond);
/* objRows -> 
 { time: '8 ms', count: 5 }
*/

// let's check my change
objRows =dBase.selectIn(tbl,61,4,0, "*");
/* objRows ->
{
  time: '1 ms',
  count: 3,
  rows: [
    {
      id: 61,
      Index: '61',
      'User Id': 'afeEEFe2E97eb9B',
      'First Name': 'Breanna',
      'Last Name': 'Cardenas',
      Sex: 'Female',
      Email: 'meganchoi@example.net',
      Phone: '366.024.6617',
      'Date of birth': '1937-01-29',
      'Job Title': '"Psychologist, forensic"'
    },
    {
      id: 62,
      Index: '62',
      'User Id': 'Ad07d6Bcc2bbe9f',
      'First Name': 'Beverly',
      'Last Name': 'Sanford',
      Sex: 'Male',
      Email: 'qklein@example.com',
      Phone: '(236)336-4342',
      'Date of birth': '1923-03-25',
      'Job Title': 'Radio broadcast assistant'
    },
    			<----------- The record with id 63 was deleted (Sex is female)
    			<----------- The record with id 64 was deleted (Sex is female)
    			<----------- The record with id 65 was deleted (Sex is female)
    {
      id: 66,
      Index: '66',
      'User Id': 'ceDFd2aA38e2c10',
      'First Name': 'Lorraine',
      'Last Name': 'Castaneda',
      Sex: 'Male',
      Email: 'btrujillo@example.org',
      Phone: '150-528-7831x7206',
      'Date of birth': '1967-12-22',
      'Job Title': 'Lobbyist'
    }
  ]
}
*/

```

### Request Features or Report Bugs

Feature requests and bug reports are very welcome: https://github.com/housseynCheriet/select-db/issues

A couple of requests from me when you raise an issue on GitHub.

* **Requesting a feature:** Please try to provide the context of why you want the feature. Such as,
  in what situation the feature could help you and how, or how the lack of the feature is causing an inconvenience to you.
  I can't start thinking of introducing it until I understand how it helps you 🙂
* **Reporting a bug:** If you could provide a runnable code snippet that reproduces the bug, it would be very helpful!
