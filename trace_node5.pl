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
print $sock "cap multigraph dirtyconfig\n"; <$sock>;
print $sock "list\n"; my $list = <$sock>; print "LIST: $list";

# config docker_cpu
print $sock "config docker_cpu\n";
my $cnt = 0;
while (<$sock>) { $cnt++; last if $_ eq ".\n"; }
print "config docker_cpu: $cnt lines (including .)\n";

# fetch docker_cpu
print $sock "fetch docker_cpu\n";
$cnt = 0;
while (<$sock>) { $cnt++; last if $_ eq ".\n"; }
print "fetch docker_cpu: $cnt lines (including .)\n";

# config docker_mem
print $sock "config docker_mem\n";
$cnt = 0;
while (<$sock>) { $cnt++; last if $_ eq ".\n"; }
print "config docker_mem: $cnt lines (including .)\n";

# fetch docker_mem
print $sock "fetch docker_mem\n";
$cnt = 0;
while (<$sock>) { $cnt++; last if $_ eq ".\n"; }
print "fetch docker_mem: $cnt lines (including .)\n";

print $sock "quit\n";
close($sock);
