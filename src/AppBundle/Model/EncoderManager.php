<?php

namespace AppBundle\Model;

use Symfony\Component\Security\Core\Encoder\BCryptPasswordEncoder;
use Symfony\Component\Security\Core\Encoder\PasswordEncoderInterface;

class EncoderManager
{
    /**
     * @var PasswordEncoderInterface
     */
    private $encoder;

    /**
     * @var string
     */
    private $salt;

    public function __construct(
        $salt
    ) {
        $this->encoder = new BCryptPasswordEncoder(4);
        $this->salt = $salt;
    }

    /**
     * @param string $raw
     *
     * @return string
     */
    public function encodeString($raw)
    {
        return $this->encoder->encodePassword($raw, $this->salt);
    }
    public function isValid($encoded, $raw)
    {
        return $this->encoder->isPasswordValid($encoded, $raw, $this->salt);
    }
}
