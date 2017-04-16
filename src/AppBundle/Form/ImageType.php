<?php

namespace AppBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\Image;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\Type;
use Vich\UploaderBundle\Form\Type\VichImageType;
use Vich\UploaderBundle\Form\Type\VichFileType;

class ImageType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name', null, [
//                "validation_groups" => ['image_create', 'image_update'],
                'constraints' => array(
                    new NotBlank(['groups' => ['image_create', 'image_update']]),
                    new Length(['min' => 1, 'max' => 255, 'groups' => ['image_create', 'image_update']]),
                ),
            ])
            ->add('login', null, [
                'constraints' => array(
                    new NotBlank(['groups' => ['image_show', 'image_create', 'image_update']]),
                    new Length(['min' => 1, 'max' => 255, 'groups' => ['image_show', 'image_create', 'image_update']]),
                ),
            ])
            ->add('password', null, [
                'constraints' => array(
                    new NotBlank(['groups' => ['image_show', 'image_create', 'image_update']]),
                    new Length(['min' => 1, 'max' => 255, 'groups' => ['image_show', 'image_create', 'image_update']]),
                ),
            ])
            ->add('new_login', null, [
                'mapped' => false,
                'constraints' => array(
                    new Type(['type' => 'string', 'groups' => ['image_update']]),
                    new Length(['min' => 1, 'max' => 255, 'groups' => ['image_update']]),
                ),
            ])
            ->add('new_password', null, [
                'mapped' => false,
                'constraints' => array(
                    new Type(['type' => 'string', 'groups' => ['image_update']]),
                    new Length(['min' => 1, 'max' => 255, 'groups' => ['image_update']]),
                ),
            ])
            ->add('file', 'Symfony\Component\Form\Extension\Core\Type\FileType', [
                'constraints' => array(
                    new NotBlank(['groups' => ['image_create', 'image_update']]),
                    new Image(['maxSize' => '5M', 'mimeTypes' => 'image/png', 'groups' => ['image_create', 'image_update']]),
                ),
            ])
        ;
    }
    
    /**
     * {@inheritdoc}
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults(array(
            'data_class' => 'AppBundle\Entity\Image',
            'csrf_protection' => false,
        ));
    }

    /**
     * {@inheritdoc}
     */
    public function getBlockPrefix()
    {
        return '';
    }
}
