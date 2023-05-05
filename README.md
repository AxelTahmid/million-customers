# Fastify Starter Template

This is a fastify starter template with authentication, otp verification, mail queue, sql adapter. 
<!-- Invalid Record Length: columns length is 8, got 15 on line 1202069 -->

Includes features :

- Auth & OTP verification
- BullMQ for queues
- User CRUD & Role
- Global Error Handler with formatted response
- S3 / Object Storage Adapter
- Rate limiting on Route by IP

## Project Structure

- app contains all separated features
- handlers => app logic only => request sanitization & response data
- services => business logic only => database & cache operations
- schemas => request validation & response serialization

## Installation Steps

### Local: Node >= 16.

create `.env` from `.env.example` file and replace with necessary values. You will need a MySQL or MariaDB database with a Redis instance. You can setup Redis with docker. Then just install and run.

```
npm install
npm run dev
```

### Docker :

this is a production image build, no pretty logs. you will need to provide necessary env values before building image.

```
docker build . -t fastifyapp
docker run -d -p 3000:3000 --name fastifyapp fastifyapp
```
