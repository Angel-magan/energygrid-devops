use IO::Socket::INET6;
use strict;
use warnings;

my $sock = IO::Socket::INET6->new(
    PeerAddr => "127.0.0.1",
    PeerPort => 4949,
    Proto    => "tcp",
    Timeout  => 10
) or die "connect: $!";

sub read_config {
    my ($sock, $label) = @_;
    my @config;
    while (my $line = <$sock>) {
        chomp $line;
        last if $line eq ".";
        push @config, $line;
    }
    print "CONFIG $label: " . scalar(@config) . " lines\n";
    return \@config;
}

sub read_fetch_fast {
    my ($sock, $label) = @_;
    my $buf = "";
    my $offset = 0;
    while (my $n = sysread($sock, $buf, 4096, $offset)) {
        $offset += $n;
        my $start = $offset - $n - 3;
        $start = 0 if $start < 0;
        last if index($buf, "\n.\n", $start) >= 0;
        last if $buf eq ".\n";
    }
    $buf =~ s/\.\n$//;
    my @fetch = split(/\n/, $buf);
    print "FETCH $label: " . scalar(@fetch) . " lines\n";
    return \@fetch;
}

sub write_cmd {
    my ($sock, $cmd) = @_;
    print $sock $cmd;
}

# greeting
my $greeting = <$sock>;
print "GREETING: $greeting";

# cap
write_cmd($sock, "cap multigraph dirtyconfig\n");
my $cap = <$sock>;
print "CAP: $cap";

# list
write_cmd($sock, "list\n");
my $list = <$sock>;
print "LIST: $list";

# docker_cpu
write_cmd($sock, "config docker_cpu\n");
my $cc = read_config($sock, "docker_cpu");
write_cmd($sock, "fetch docker_cpu\n");
my $fc = read_fetch_fast($sock, "docker_cpu");
print "  cpu fetch[0]: $fc->[0]\n" if @$fc > 0;

# docker_disk
write_cmd($sock, "config docker_disk\n");
my $cd = read_config($sock, "docker_disk");
write_cmd($sock, "fetch docker_disk\n");
my $fd = read_fetch_fast($sock, "docker_disk");
print "  disk fetch[0]: $fd->[0]\n" if @$fd > 0;

# docker_mem
write_cmd($sock, "config docker_mem\n");
my $cm = read_config($sock, "docker_mem");
write_cmd($sock, "fetch docker_mem\n");
my $fm = read_fetch_fast($sock, "docker_mem");
print "  mem fetch[0]: $fm->[0]\n" if @$fm > 0;

# docker_net
write_cmd($sock, "config docker_net\n");
my $cn = read_config($sock, "docker_net");
print "  net config[0]: $cn->[0]\n" if @$cn > 0;
write_cmd($sock, "fetch docker_net\n");
my $fn = read_fetch_fast($sock, "docker_net");
print "  net fetch[0]: $fn->[0]\n" if @$fn > 0;

write_cmd($sock, "quit\n");
close($sock);
print "DONE\n";
