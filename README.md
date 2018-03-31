# SWIM-gossip
SWIM implementation of gossip protocol.

read about it [here](http://www.cs.cornell.edu/info/projects/spinglass/public_pdfs/swim.pdf)

## Todo
[] failure detection
    1.  node sends a PING message to a random node M₁ in list
        *   if an ACK is not received M₁ before time period _T_:
            *   node sends PING-REQ to _K_ number of randomly chosen nodes,
                who forward a PING onto M₁. 
    2.  after _T_ if no ACK is received by M₁ it is failed and node sends
        dissemenation message

[] message dissemination notification

[] tapenet/mininet test
