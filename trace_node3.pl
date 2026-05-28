use IO::Socket::INET6;
use strict;
use warnings;

my $sock = IO::Socket::INET6->new(
    PeerAddr => "127.0.0.1",
    PeerPort => 4949,
    Proto    => "tcp",
    Timeout  => 10
) or die "connect: $!";

sub write_cmd { my ($sock, $cmd) = @_; print $sock $cmd; print "SENT: $cmd"; }

my $greeting = <$sock>; print "GOT: $greeting";
write_cmd($sock, "cap multigraph dirtyconfig\n"); my $cap = <$sock>; print "GOT: $cap";
write_cmd($sock, "list\n"); my $list = <$sock>; print "GOT: $list";

# Test fetch docker_cpu FIRST (no prior config)
write_cmd($sock, "fetch docker_cpu\n");
my $buf = "";
while (<$sock>) {
    print "  FETCH RAW: $_";
    last if $_ eq ".\n";
    $buf .= $_;
}
my @lines = split /\n/, $buf;
print "FETCH docker_cpu (no prior config): " . scalar(@lines) . " lines\n\n";

# Now test config
write_cmd($sock, "config docker_cpu\n");
$buf = "";
while (<$sock>) {
    print "  CONFIG RAW: $_";
    last if $_ eq ".\n";
    $buf .= $_;
}
@lines = split /\n/, $buf;
print "CONFIG docker_cpu: " . scalar(@lines) . " lines\n\n";

# Now fetch again (after config)
write_cmd($sock, "fetch docker_cpu\n");
$buf = "";
while (<$sock>) {
    print "  FETCH2 RAW: $_";
    last if $_ eq ".\n";
    $buf .= $_;
}
@lines = split /\n/, $buf;
print "FETCH docker_cpu (after config): " . scalar(@lines) . " lines\n\n";

write_cmd($sock, "quit\n");
close($sock);
print "DONE\n";
