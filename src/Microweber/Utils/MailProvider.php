<?php
namespace Microweber\Utils;

use MailerLiteApi\MailerLite;

class MailProvider
{
	protected $listTitle = '';
	protected $email = '';
	protected $firstName = '';
	protected $phone = '';
	protected $companyName = '';
	protected $companyPosition = '';
	protected $countryRegistration = '';
	protected $message = '';

	public function setListTitle($title) {
		$this->listTitle = $title;
	}
		
	public function setEmail($email) {
		$this->email = $email;
	}

	public function setFirstName($name) {
		$this->name = $name;
	}

	public function setPhone($phone) {
		$this->phone = $phone;
	}

	public function setCompanyName($name) {
		$this->companyName = $name;
	}

	public function setCompanyPosition($position) {
		$this->companyPosition = $position;
	}

	public function setCountryRegistration($country) {
		$this->countryRegistration = $country;
	}

	public function setMessage($message) {
		$this->message = $message;
	}

	public function submit() {
		$this->_mailerLite();
	}
	
	private function _mailerLite() {
		
		$mailerliteApiKey = get_option('mailerlite_api_key', 'contact_form_default');
		
		if (!empty($mailerliteApiKey)) {
			
			$groupsApi = (new MailerLite($mailerliteApiKey))->groups();
			$allGroups = $groupsApi->get();
			
			$groupNames = array();
			foreach($allGroups as $group) {
				$groupNames[] = $group->name;
				$groupId = $group->id;
			}
			
			if (!in_array($this->listTitle, $groupNames)) {
				$newGroup = $groupsApi->create(['name' => $this->listTitle]);
				$groupId = $newGroup->id;
			}
			
			$subscribersApi = (new MailerLite($mailerliteApiKey))->subscribers();
			$allSubscribers = $subscribersApi->get();
			
			$subscriberEmails = array();
			foreach($allSubscribers as $subscriber) {
				$subscriberEmails[] = $subscriber->email;
			}
			
			if (!in_array($this->email, $subscriberEmails)) {
				$subscriber = [
					'email' => $this->email,
					'fields' => [
						'name' => $this->firstName,
						'last_name' => '',
						'phone' => $this->phone,
						'company' => $this->companyName
					]
				];
				$groupsApi->addSubscriber($groupId, $subscriber);
			}
			
		}
	}
}