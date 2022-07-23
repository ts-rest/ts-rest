# tscont

## Motivation

tscont aims to allow for the creation of type safe contracts to be upheld by producers and consumers of the contract.

Some end-to-end type safe libraries such as [tRPC](https://trpc.io/) are amazing, however, they aren't able to separate the contract from the implementation, in situations with published packages or wanting to avoid unnecessary rebuilds with tools such as NX this is a problem.

One example of this is with NX, in NX you can rebuild only "affected" packages, however, if you export your contract (e.g. tRPC) from the backend, your front end will need to be rebuilt as well.

## Contract Abstraction

## Implementation - API
