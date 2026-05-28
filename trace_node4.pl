use IO::Socket::INET6;
use strict;
use warnings;

my $sock = IO::Socket::INET6->new(
    PeerAddr => "127.0.0.1",
    PeerPort => 4949,
    Proto    => "tcp",
    Timeout  => 10
) or die "connect: $!";

my $greeting = <$sock>; print "GOT: $greeting";
print $sock "cap multigraph dirtyconfig\n"; print "SENT: cap\n"; my $cap = <$sock>; print "GOT: $cap";
print $sock "list\n"; print "SENT: list\n"; my $list = <$sock>; print "GOT: $list";

# config docker_mem (fast - no docker stats)
print $sock "config docker_mem\n"; print "SENT: config docker_mem\n";
while (<$sock>) { last if $_ eq ".\n"; }
print "DONE config docker_mem\n";

# fetch docker_mem (SLOW - runs docker stats per container)
print $sock "fetch docker_mem\n"; print "SENT: fetch docker_mem\n";
my $count = 0;
while (<$sock>) {
    $count++ unless $_ eq ".\n";
    last if $_ eq ".\n";
}
print "DONE fetch docker_mem: $count data lines\n";

# config docker_net (fast)
print $sock "config docker_net\n"; print "SENT: config docker_net\n";
while (<$sock>) { last if $_ eq ".\n"; }
print "DONE config docker_net\n";

# fetch docker_net (SLOW)
print $sock "fetch docker_net\n"; print "SENT: fetch docker_net\n";
$count = 0;
while (<$sock>) {
    $count++ unless $_ eq ".\n";
    last if $_ eq ".\n";
}
print "DONE fetch docker_net: $count data lines\n";

# Now test: config + fetch for docker_disk (SLOW)
print $sock "config docker_disk\n"; print "SENT: config docker_disk\n";
while (<$sock>) { last if $_ eq ".\n"; }
print "DONE config docker_disk\n";

print $sock "fetch docker_disk\n"; print "SENT: fetch docker_disk\n";
$count = 0;
while (<$sock>) {
    $count++ unless $_ eq ".\n";
    last if $_ eq ".\n";
}
print "DONE fetch docker_disk: $count data lines\n";

print $sock "quit\n";
close($sock);
print "ALL DONE\n";
