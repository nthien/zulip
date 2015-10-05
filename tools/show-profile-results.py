#!/usr/bin/env python
import sys
import pstats

'''
This is a helper script to make it easy to show profile
results after using a Python decorator.  It's meant to be
a simple example that you can hack on, or better yet, you
can find more advanced tools for showing profiler results.
'''

try:
    fn = sys.argv[1]
except:
    print '''
    Please supply a filename.  (If you use the profiled decorator,
    the file will have a suffix of ".profile".)
    '''
    sys.exit(1)

p = pstats.Stats(fn)
p.strip_dirs().sort_stats('cumulative').print_stats(25)
p.strip_dirs().sort_stats('time').print_stats(25)

