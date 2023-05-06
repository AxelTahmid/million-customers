# Processing 1Million+ rows of csv via Node.js

This was an interesting problem to come across. Filtering 1M+ rows from a csv to sql seems like an architechtural flaw to begin with. That being said, provided csv file had 89 occurences of misplaced column. Probably a large dataset was copy-pasted repeatedly and forgot to put in a newline before pasting.

## Problem Approach

I can only think of two ways to solve this problem. 
- Stream it! => use `streams` to `pipe` data in chunks, process it, store it.
- All SQL => use `LOAD DATA INFILE` from `MySQL` to directly import it and postprocess into separate tables

I went with the first approach as second would introduce some major vulnerability if done through an webserver. A bash script inside myqsl server may work just fine.

I could have not used a webserver, but for `a complete app` included this. avoided using `multer` to upload as instruction sets did not mention anything explicitly about it.

The following are the execution time for the process
* 87 seconds -  no filter, insert all in one table
* 93 seconds - with filter 
* 94 seconds - with filter and export to csv

## Project Structure
This is a `fastify` application. It is known to be extremely performant and scalabale, beats express anyday.
- app -> contains all encapsulated features
- handlers => app logic only 
- services => business logic only 
- schemas => request validation & response serialization

## Installation Steps

### Local

Requirements:
- `MySQL >= 8`
- `Node.js >= 18`
- `NPM >= 9`

create `.env` from `.env.example` file and replace with proper database values.
Host should be `0.0.0.0` if you are using Docker. Then install the app.

```
npm install
```

once you have proper values for DB in env, run 

```
npm run db:migrate
```

this will process migration and create the necessary tables. incase of testing docker, need to already have migrations in your db as we are using a distroless image.

### Docker :

this is a production image build  using distroless Node by Google, just barebones Kernel hotwired with Nodejs. Make sure your `MySQL` instance is on the same `Virtual Network` of your application instance. Otherwise you will not be able to run this app. I have included `Kubernetes` manifests file, so feel free to use that as well.

first build your image, give it a name and tag. `Do Not Forget` to keep the `csv` you want to process within `data` folder of app. Otherwise, It's not going to work.
```
docker build . -t millioncsv:v1
```
then use the built image to create a compute instance, it will keep running in the background
```
docker run -d -p 3000:3000 --name appinstance millioncsv:v1
```

## Execution Steps

Please ensure you have the `csv` you want to process in the `data` folder on the root of your application. Once the installation is done, run `npm run dev` and your webserver will start. If you are using docker, just ensure you have your csv in data folder.

There is only one endpoint that takes the filename to look for in `data` folder and processes it. Here is the API Doc for it:

```
filename = file to look for in data folder

HTTP/1.1

HOST: localhost:3000

POST /v1/customer/parse?filename=<filename> 

```

i.e : `localhost:3000/v1/customer/parse?filename=<filename>`

request returns execution time in `ms - miliseconds`.

This will trigger the process. given csv will be parsed, processed, inserted to sql and simultaneously filtered data written to `data/output` 

## Note
if you get errors related to columns breaking, use a proper `csv` file. Or use `VSCode` and regex to filter it. the `csv` values are in `data/output` folder