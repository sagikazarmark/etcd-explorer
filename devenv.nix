{ pkgs, ... }:

{
  packages = [ pkgs.etcd ];

  languages = {
    typescript = {
      enable = true;
    };

    javascript = {
      enable = true;
    };
  };
}
