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
$sock->autoflush(1);

sub xprint {
    my ($msg) = @_;
    syswrite($sock, $msg);
}

sub xread_dot {
    my ($label) = @_;
    my @lines;
    while (my $line = <$sock>) {
        chomp $line;
        last if $line eq ".";
        push @lines, $line;
    }
    print "--- $label: " . scalar(@lines) . " lines ---\n";
    for my $l (@lines) {
        print "  $l\n";
    }
    return \@lines;
}

sub xread_single {
    my ($label) = @_;
    my $line = <$sock>;
    chomp $line if defined $line;
    print "$label: $line\n";
    return $line;
}

my $greeting = <$sock>; print "GREETING: $greeting";

xprint("cap multigraph dirtyconfig\n");
xread_single("CAP");

xprint("list\n");
my $list = xread_single("LIST");

for my $svc (sort split(' ', $list)) {
    next unless $svc =~ /^docker_/;
    
    print "\n";
    xprint("config $svc\n");
    my $cfg_lines = xread_dot("config $svc");
    
    xprint("fetch $svc\n");
    my $fetch_lines = xread_dot("fetch $svc");
}

xprint("quit\n");
close($sock);
print "\nDONE\n";
