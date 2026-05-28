use Storable;
use Data::Dumper;
my $d = Storable::retrieve("/var/lib/munin/state-localhost-localhost.storable");
print Dumper($d);
