#! /bin/bash

yum update -y
yum install -y docker
usermod -aG docker ec2-user

/usr/local/bin/aws s3api get-object --bucket $1 --key $2 /home/ec2-usuer/$2



