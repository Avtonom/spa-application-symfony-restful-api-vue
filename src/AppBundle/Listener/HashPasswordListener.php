<?php

namespace AppBundle\Listener;

use AppBundle\Entity\Image;
use AppBundle\Model\EncoderManager;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Event\LifecycleEventArgs;

class HashPasswordListener implements EventSubscriber
{
    /**
     * @var EncoderManager
     */
    private $encoderManager;

    public function getSubscribedEvents()
    {
        return ['prePersist', 'preUpdate'];
    }

    public function __construct(EncoderManager $encoderManager)
    {
        $this->encoderManager = $encoderManager;
    }

    public function prePersist(LifecycleEventArgs $args)
    {
        $entity = $args->getEntity();
        if (!$entity instanceof Image) {
            return;
        }
        $this->encodePassword($entity);
    }

    public function preUpdate(LifecycleEventArgs $args)
    {
        $entity = $args->getEntity();
        if (!$entity instanceof Image) {
            return;
        }
        $this->encodePassword($entity);

        $em = $args->getEntityManager();
        $meta = $em->getClassMetadata(get_class($entity));
        $em->getUnitOfWork()->recomputeSingleEntityChangeSet($meta, $entity);
    }

    /**
     * @param Image $entity
     */
    private function encodePassword(Image $entity)
    {
        if (!$entity->getPlainPassword()) {
            return;
        }
        $encoded = $this->encoderManager->encodeString($entity->getPlainPassword());
        $entity->setPlainPassword(null);
        $entity->setPassword($encoded);
    }
}
