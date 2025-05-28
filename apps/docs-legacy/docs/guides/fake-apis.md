# Fake APIs for Testing

Using `ts-rest`, you can easily create a fake version of your API for frontend development and acceptance testing. To achieve this, simply reuse the contract from your production API and provide fake implementations. This approach ensures that your fake API mirrors the response types of your real API, increasing confidence in your testing.

## Example

### Defining the Contract

```typescript
import { initContract } from '@ts-rest/core'

const c = initContract()
export const contract = c.router({
  getDogs: {
    method: 'GET',
    path: '/dogs',
    responses: {
      200: z.array(z.string()),
    },
  },
  addDog: {
    method: 'POST',
    path: '/dogs',
    body: z.object({
      name: z.string(),
    }),
    responses: {
      200: z.object({
        message: z.string(),
      }),
      400: z.object({
        error: z.string(),
      }),
    },
  },
})
```

### Implementing the Fake API

Unlike the production version of your API, which typically depends on external services like databases or other APIs, the fake API utilizes in-memory storage. This bypasses the complexities associated with external dependencies (such as authentication, network issues, etc.), allowing you to focus on your API's behavior.

For simplicity, [`@ts-rest/express`](https://ts-rest.com/docs/express/) is often the best choice, though other `ts-rest` server implementations will work as well.

```typescript
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Use a simple in-memory data store instead of a database
class InMemoryDogStore {
  // Initialize with sample data
  private readonly _dogs = ['fido', 'rex']

  getDogs() {
    return this._dogs
  }

  addDog(name: string) {
    this._dogs.push(name)
  }
}
const dogStore = new InMemoryDogStore()

const s = initServer()
const router = s.router(contract, {
  getDogs: async () => {
    return {
      status: 200,
      // Get dogs from the in-memory store
      body: dogStore.getDogs(),
    }
  },
  addDog: async ({ body: { name } }) => {
    if (!name) {
      return {
        status: 400,
        body: { error: 'Name is required' },
      }
    }

    // Update the in-memory store
    dogStore.addDog(name)

    return {
      status: 200,
      body: { message: 'Dog added' },
    }
  },
})

createExpressEndpoints(contract, router, app)

app.listen(6900, () => {
  console.log('Fake API is running on port 6900')
})
```

Next, point your app to this fake API, and you're all set!

