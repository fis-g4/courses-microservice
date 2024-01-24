# courses-microservice
This microservice manages courses.

# reviews-microservice
This microservice manages reviews.

The reviews-microservice has been integrated from the following repository: https://github.com/fis-g4/review-microservice

The reviews-microservice was integrated in the following commit: https://github.com/fis-g4/courses-microservice/commit/264f6a1a6d41b99ab7c508045dd71a6a4f8a9e0f

Please do check said repository in order to see the commits that had been done there before the integration of services.

# Local deployment, testing and swagger documentation

For local deployment, it's convenient to remove the password demand in the file /server/db/redis.ts:

Change:
```javascript
const redisURL = `redis://:${redis.password}@${redis.host}:${redis.port}`
```
With:
```javascript
const redisURL = `redis://${redis.host}:${redis.port}`
```

Moreover, the content in this repository is more up-to-date than the deployed content. This was done to make sure that a last-minute deployment wouldn't compromise our colleagues' work.

The notable changes between the content of the repository and the deployed version are the up-to-date backend tests and updated servers for swagger documentation.

# More information

More information about our project may be found on our wiki! This is the link to it: https://github.com/fis-g4/courses-microservice/wiki
