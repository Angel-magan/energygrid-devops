#!/usr/bin/perl
use strict;
use warnings;
$| = 1;

use IO::Socket::INET;

my $sock = IO::Socket::INET->new(
    PeerAddr => "127.0.0.1",
    PeerPort => 4949,
) or die "connect: $!";
$sock->autoflush(1);

sub xprint {
    syswrite($sock, $_[0]);
}

sub xread_dot {
    my ($label) = @_;
    my @lines;
    eval {
        local $SIG{ALRM} = sub { die "timeout\n" };
        alarm 30;
        while (my $line = <$sock>) {
            chomp $line;
            last if $line eq ".";
            push @lines, $line;
        }
        alarm 0;
    };
    my $n = scalar(@lines);
    print "  $label: $n lines\n";
    return \@lines if $n == 0;
    my $show = $n < 10 ? $n : 10;
    for (0..$show-1) {
        print "    $lines[$_]\n";
    }
    print "    ...\n" if $n > 10;
}

my $greeting = <$sock>; print "GREETING: $greeting";

xprint("cap multigraph dirtyconfig\n");
my $cap = <$sock>; chomp $cap; print "CAP: $cap\n";

xprint("list\n");
my $list = <$sock>; chomp $list; print "LIST: $list\n";

for my $svc (split(' ', $list)) {
    next unless $svc =~ /^docker_/;
    
    print "\n--- $svc ---\n";
    
    xprint("config $svc\n");
    xread_dot("config $svc");
    
    xprint("fetch $svc\n");
    xread_dot("fetch $svc");
}

xprint("quit\n");
close($sock);
print "\nDONE\n";
