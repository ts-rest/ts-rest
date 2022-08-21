---
sidebar_position: 3
---

# GraphQL Comparison

GraphQL is a query language that is designed to be an alternative to REST APIs, it allows you to design a schema, and then use code generation to generate the server and client implementations.

## Problems With GraphQL

1. Frequent performance issues, e.g. N+1
2. REST can do much of what GraphQL does
3. GraphQL makes some tasks more complex
4. It’s easier to use a web cache with REST than with GraphQL
5. Error handling with GraphQL is a bit more complex

## GraphQL vs tREST

One common issue is that many teams take on GraphQL, despite only needing a subset of its features, unfortunately, doing so they took on the problems of GraphQL.

Many teams prioritise two things, stability, and deliverability. tREST aims to provide both of these by providing a fully type safe API, with no code generation, and all of the benefits of a REST API.
