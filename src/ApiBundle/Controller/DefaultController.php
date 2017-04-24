<?php

namespace ApiBundle\Controller;

use AppBundle\Entity\Image;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Response as Codes;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\HttpFoundation\File\File;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;

use FOS\RestBundle\View\View;
use FOS\RestBundle\Controller\FOSRestController;
use FOS\RestBundle\Request\ParamFetcher;
use FOS\RestBundle\Controller\Annotations;
use FOS\RestBundle\Request\ParamFetcherInterface;
use FOS\RestBundle\Controller\Annotations\RouteResource;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;

use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class DefaultController extends FOSRestController
{
    /**
     * @ApiDoc(
     *   resource = true,
     *   section = "Image",
     *   output = {
     *      "class" = "array<AppBundle\Entity\Image>",
     *      "groups"={"image_list"},
     *   },
     * )
     */
    public function getListImageAction()
    {
        $em = $this->getDoctrine()->getManager();
        $images = $em->getRepository('AppBundle:Image')->findAll();
//        return $images;
        return View::create($images);
    }

    /**
     * Creates a new image entity.
     *
     * @ApiDoc(
     *   resource = true,
     *   section = "Image",
     *   input = {
     *      "class" = "AppBundle\Form\ImageType",
     *      "groups"={"image_create"},
     *   },
     *   output = {
     *      "class" = "AppBundle\Entity\Image",
     *      "groups"={"image_create"},
     *   },
     *   statusCodes = {
     *     201 = "Created  - Images успешно создан",
     *     400 = "Bad Request - Входные параметры содержат ошибку",
     *   },
     * )
     */
    public function postImageAction(Request $request)
    {
        $image = new Image();
        $form = $this->createForm('AppBundle\Form\ImageType', $image, [
            'validation_groups' => array('image_create'),
        ]);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $image->setPlainPassword($image->getPassword());
            $em = $this->getDoctrine()->getManager();
            $em->persist($image);
            $em->flush();

            return View::create($image, Response::HTTP_CREATED);
        }
        return View::create($form, Response::HTTP_BAD_REQUEST);
    }

    /**
     * Update image entity.
     *
     * @ApiDoc(
     *   resource = true,
     *   authentication = true,
     *   section = "Image",
     *   input = {
     *      "class" = "AppBundle\Form\ImageType",
     *      "groups"={"image_update"}
     *   },
     *   output = {
     *      "class" = "AppBundle\Entity\Image",
     *      "groups"={"image_update"},
     *   },
     *   statusCodes = {
     *     200 = "OK - Успешный запрос",
     *     400 = "Bad Request - Входные параметры содержат ошибку",
     *     403 = "Access Denied",
     *     404 = "Not found",
     *   },
     * )
     */
    public function postUpdateImageAction(Request $request, Image $image)
    {
        $login = $image->getLogin();
        $password = $image->getPassword();
        $form = $this->createForm('AppBundle\Form\ImageType', $image, [
//            'method' => 'POST',
            'method' => $request->getMethod(),
            'validation_groups' => array('image_update'),
        ]);
        $form->handleRequest($request);
        if ($form->isValid()) {
            if($request->request->get('login') != $login || !$this->get('app.encoder_manager')->isValid($password, $request->request->get('password'))){
                throw new AccessDeniedHttpException();
            }
            $image->setPlainPassword($image->getPassword());
            if($request->request->has('new_login') && strlen($request->request->get('new_login'))){
                $image->setLogin($request->request->get('new_login'));
            }
            if($request->request->has('new_password') && strlen($request->request->get('new_password'))){
                $image->setPlainPassword($request->request->get('new_password'));
            }
            $this->getDoctrine()->getManager()->flush();

            return View::create($image, Response::HTTP_OK);
        }
        return View::create($form, Response::HTTP_BAD_REQUEST);
    }

    /**
     * Get one
     *
     * @ApiDoc(
     *   resource = true,
     *   section = "Image",
     *   authentication = true,
     *   input = {
     *      "class" = "AppBundle\Form\ImageType",
     *      "groups"={"image_show"}
     *   },
     *   output = {
     *      "class" = "AppBundle\Entity\Image",
     *      "groups"={"image_show"},
     *   },
     *   statusCodes = {
     *     200 = "OK - Успешный запрос",
     *     400 = "Bad Request - Входные параметры содержат ошибку",
     *     403 = "Access Denied",
     *     404 = "Not found",
     *   },
     * )
     */
    public function getImageAction(Request $request, Image $image)
    {
        $login = $image->getLogin();
        $password = $image->getPassword();
        $form = $this->createForm('AppBundle\Form\ImageType', null, [
            'method' => $request->getMethod(),
            'validation_groups' => array('image_show'),
        ]);
        $form->handleRequest($request);

        if ($form->isValid()) {
            if($request->query->get('login') != $login || !$this->get('app.encoder_manager')->isValid($password, $request->query->get('password'))){
                throw new AccessDeniedHttpException();
            }
            $downloadHandler = $this->get('vich_uploader.download_handler');
            ob_start();
            echo $downloadHandler->downloadObject($image, $fileField = 'file')->sendContent();
            $content = ob_get_contents();
            ob_end_clean();
            $dataUri = ($content) ? "data:image/png;base64," . base64_encode($content) : null;
            $image->setFileContent($dataUri);
            return View::create($image, Response::HTTP_OK);
        }
        return View::create($form, Response::HTTP_BAD_REQUEST);
    }
}
