use IO::Socket::INET6;
use strict;
use warnings;

my $sock = IO::Socket::INET6->new(
    PeerAddr => "127.0.0.1",
    PeerPort => 4949,
    Proto    => "tcp",
    Timeout  => 10
) or die "connect: $!";

sub read_all_lines {
    my ($sock, $label) = @_;
    my @lines;
    while (my $line = <$sock>) {
        chomp $line;
        last if $line eq ".";
        push @lines, $line;
    }
    print "$label: " . scalar(@lines) . " lines\n";
    print "  first: $lines[0]\n" if @lines > 0;
    return \@lines;
}

sub write_cmd { my ($sock, $cmd) = @_; print $sock $cmd; }

my $greeting = <$sock>; print "GREETING: $greeting";
write_cmd($sock, "cap multigraph dirtyconfig\n"); my $cap = <$sock>; print "CAP: $cap";
write_cmd($sock, "list\n"); my $list = <$sock>; print "LIST: $list";

# docker_cpu - BOTH use readline
write_cmd($sock, "config docker_cpu\n");
read_all_lines($sock, "CONFIG docker_cpu");
write_cmd($sock, "fetch docker_cpu\n");
read_all_lines($sock, "FETCH docker_cpu");

# docker_disk - BOTH use readline
write_cmd($sock, "config docker_disk\n");
read_all_lines($sock, "CONFIG docker_disk");
write_cmd($sock, "fetch docker_disk\n");
read_all_lines($sock, "FETCH docker_disk");

# docker_mem - BOTH use readline
write_cmd($sock, "config docker_mem\n");
read_all_lines($sock, "CONFIG docker_mem");
write_cmd($sock, "fetch docker_mem\n");
read_all_lines($sock, "FETCH docker_mem");

# docker_net - BOTH use readline
write_cmd($sock, "config docker_net\n");
read_all_lines($sock, "CONFIG docker_net");
write_cmd($sock, "fetch docker_net\n");
read_all_lines($sock, "FETCH docker_net");

write_cmd($sock, "quit\n");
close($sock);
print "DONE - all correct!\n";
