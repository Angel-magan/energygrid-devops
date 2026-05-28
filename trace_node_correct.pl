#!/usr/bin/perl
use strict;
use warnings;
$| = 1;

use IO::Socket::INET;

my $sock = IO::Socket::INET->new(
    PeerAddr => "127.0.0.1",
    PeerPort => 4949,
    Proto    => "tcp",
    Timeout  => 10
) or die "connect: $!";

# CRITICAL: Enable autoflush on the socket
$sock->autoflush(1);

sub xprint {
    my ($msg) = @_;
    my $len = syswrite($sock, $msg);
    print "WROTE $len bytes: $msg";
}

sub xread_dot {
    my ($label) = @_;
    my @lines;
    while (my $line = <$sock>) {
        chomp $line;
        last if $line eq ".";
        push @lines, $line;
    }
    print "$label: " . scalar(@lines) . " data lines\n";
    return \@lines;
}

sub xread_single {
    my ($label) = @_;
    my $line = <$sock>;
    chomp $line if defined $line;
    print "$label: $line\n";
    return $line;
}

# Greeting
my $greeting = <$sock>; print "GREETING: $greeting";

# cap - single line response
xprint("cap multigraph dirtyconfig\n");
xread_single("CAP");

# list - single line response
xprint("list\n");
my $list = xread_single("LIST");

# For each docker plugin
for my $svc (split(' ', $list)) {
    next unless $svc =~ /^docker_/;
    
    print "\n--- $svc ---\n";
    
    # config
    xprint("config $svc\n");
    my $cfg_lines = xread_dot("config $svc");
    
    # fetch
    xprint("fetch $svc\n");
    my $fetch_lines = xread_dot("fetch $svc");
}

xprint("quit\n");
close($sock);
print "\nDONE\n";
