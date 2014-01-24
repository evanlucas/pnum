# pnum

A wrapper for [smart-private-npm](https://github.com/nodejitsu/smart-private-npm) that loads all of your private modules first

## Installation

```
$ npm install -g pnum
```

## Usage

```
 Usage: pnum [options]

 Where [options] can be
   --private <url>           set your private registry
   --public <url>            set the public registry url
   --config <path>           set the path to your config file
   --exclude <pkg>           exclude _pkg_ from being private
   --help                    show help and usage
   --version                 show version information

 The following aliases are also available
   --priv    =>   --private
   --pub     =>   --public
   -c        =>   --config
   -e        =>   --exclude
   -h        =>   --help
   -v        =>   --version
```

## License

MIT
