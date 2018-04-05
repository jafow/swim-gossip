# SWIM-gossip
SWIM implementation of gossip protocol.

read about it [here](http://www.cs.cornell.edu/info/projects/spinglass/public_pdfs/swim.pdf)

## Getting Started
clone the repo & `npm install` dependencies.

## example

run:

```bash
$ node example.js
```

to see wip example.

## Todo
- [ ] failure detection

1.  node sends a PING message to a random node M₁ in list

    *   if an ACK is not received M₁ before time period _T_: node sends PING-REQ
    to _K_ number of randomly chosen nodes, who forward a PING onto M₁. 

2.  after _T_ if no ACK is received by M₁ it is failed and node sends
    dissemenation message

- [ ] message dissemination notification

*   on determining a failure, send multicast FAIL to all nodes in `nodeList`

- [ ] tapenet/mininet test

- [ ] bootstrapping

1. node sends a `JOIN_REQ` message to a known facilitator that keeps list of
   N most recently joined nodes and uses the `JOIN_REP` response to create list
   and announce
    *   v0.0.1: bootstrap node has a known address
    *   v0.0.2: use dns to resolve a name
