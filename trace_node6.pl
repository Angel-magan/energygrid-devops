use IO::Socket::INET6;
use strict;
use warnings;

my $sock = IO::Socket::INET6->new(
    PeerAddr => "127.0.0.1",
    PeerPort => 4949,
    Proto    => "tcp",
    Timeout  => 10
) or die "connect: $!";

# Enable autoflush on both directions
$sock->autoflush(1);
select($sock); $| = 1; select(STDOUT);

sub xread {
    my ($label) = @_;
    my $cnt = 0;
    while (my $line = <$sock>) {
        $cnt++;
        last if $line eq ".\n";
    }
    print "$label: $cnt lines\n";
}

sub xcmd {
    my ($cmd) = @_;
    print $sock "$cmd\n";
}

my $greeting = <$sock>; print "GOT: $greeting";
xcmd("cap multigraph dirtyconfig"); xread("CAP");
xcmd("list"); xread("LIST");

xcmd("config docker_cpu"); xread("CONFIG docker_cpu");
xcmd("fetch docker_cpu"); xread("FETCH docker_cpu");
xcmd("config docker_mem"); xread("CONFIG docker_mem");
xcmd("fetch docker_mem"); xread("FETCH docker_mem");
xcmd("quit");

close($sock);
